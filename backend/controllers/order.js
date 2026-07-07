const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const User = db.User;
const sendEmail = require('../utils/sendEmail');
const { generateOrderReceipt } = require('../utils/generatePDF');
const { buildOrderEmail } = require('../utils/emailTemplate');
const { enrichOrder, enrichOrders } = require('../utils/orderTotals');
const { Op } = require('sequelize');

const orderIncludes = [{
  model: OrderItem,
  include: [{ model: Product, attributes: ['id', 'name', 'item_code', 'image_url', 'unit_price', 'category'] }]
}];

const loadOrder = (id, options = {}) => Order.findOne({
  where: { id, deleted_at: null, ...options.where },
  include: [
    { model: User, attributes: ['id', 'name', 'email'] },
    ...orderIncludes
  ]
});

const sendOrderEmail = async (order, enriched, { subject, intro, includePdf = true }) => {
  const emailOptions = {
    email: order.User.email,
    subject,
    html: buildOrderEmail({
      customerName: order.User.name,
      order: enriched,
      intro
    })
  };

  if (includePdf) {
    const pdfBuffer = await generateOrderReceipt(enriched);
    emailOptions.attachments = [{ filename: `receipt-order-${order.id}.pdf`, content: pdfBuffer }];
  }

  await sendEmail(emailOptions);
};

exports.createOrder = async (req, res) => {
  try {
    const { cart, shipping_address, payment_method } = req.body;
    const userId = req.authUser?.id ?? req.body.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    if (!shipping_address) return res.status(400).json({ error: 'Shipping address required' });

    for (const item of cart) {
      const product = await Product.findByPk(item.product_id);
      if (!product) return res.status(404).json({ error: `Product ${item.product_id} not found` });
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    const transaction = await db.sequelize.transaction();

    try {
      const order = await Order.create({
        user_id: userId,
        shipping_address,
        payment_method: payment_method || 'Cash on Delivery',
        status: 'Pending'
      }, { transaction });

      for (const item of cart) {
        const product = await Product.findByPk(item.product_id, { transaction });
        await OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size || product.size
        }, { transaction });
        await Product.update(
          { stock_quantity: Math.max(0, product.stock_quantity - item.quantity) },
          { where: { id: item.product_id }, transaction }
        );
      }

      await transaction.commit();

      const fullOrder = await loadOrder(order.id);
      const enriched = enrichOrder(fullOrder);

      try {
        await sendOrderEmail(fullOrder, enriched, {
          subject: `Order Confirmed #${order.id} — Jordan Brand Store`,
          intro: `Your order has been placed successfully! We\'re getting it ready for you.`,
          includePdf: true
        });
      } catch (emailErr) {
        console.error('Order confirmation email failed:', emailErr.message);
      }

      return res.status(201).json({
        success: true,
        order_id: order.id,
        computed_total: enriched.computed_total,
        message: 'Order placed successfully'
      });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error creating order', details: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.authUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const orders = await Order.findAll({
      where: { user_id: userId, deleted_at: null },
      include: orderIncludes,
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ rows: enrichOrders(orders) });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.authUser?.id ?? req.body.user?.id;
    const userRole = req.authUser?.role ?? req.body.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const where = { id: req.params.id, deleted_at: null };
    if (userRole !== 'admin') {
      where.user_id = userId;
    }

    const order = await Order.findOne({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        ...orderIncludes
      ]
    });

    if (!order) {
      return res.status(userRole === 'admin' ? 404 : 403).json({
        error: userRole === 'admin' ? 'Order not found' : 'Access denied'
      });
    }

    return res.status(200).json({ order: enrichOrder(order) });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching order' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { trashed } = req.query;
    const where = trashed === '1'
      ? { deleted_at: { [Op.ne]: null } }
      : { deleted_at: null };

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, attributes: ['name', 'email'] },
        ...orderIncludes
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ rows: enrichOrders(orders) });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching orders' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { status, shipping_address, payment_method, admin_note } = req.body;
    const order = await loadOrder(req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const previousStatus = order.status;
    const updates = {};

    if (status) updates.status = status;
    if (shipping_address !== undefined) updates.shipping_address = shipping_address;
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (admin_note !== undefined) updates.admin_note = admin_note;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await order.update(updates);

    const refreshed = await loadOrder(order.id);
    const enriched = enrichOrder(refreshed);
    const statusChanged = status && status !== previousStatus;

    if (statusChanged) {
      try {
        await sendOrderEmail(refreshed, enriched, {
          subject: `Order #${order.id} Updated — Jordan Brand Store`,
          intro: `Your order status has been updated to <strong>${status}</strong>.`,
          includePdf: true
        });
      } catch (emailErr) {
        console.error('Order status email failed:', emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: enriched
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error updating order' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.deleted_at) return res.status(400).json({ error: 'Order is already in trash' });

    await order.update({ deleted_at: new Date() });
    return res.status(200).json({ success: true, message: 'Order moved to trash' });
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting order' });
  }
};

exports.restoreOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.deleted_at) return res.status(400).json({ error: 'Order is not in trash' });

    await order.update({ deleted_at: null });
    return res.status(200).json({ success: true, message: 'Order restored' });
  } catch (err) {
    return res.status(500).json({ error: 'Error restoring order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  req.body = {
    ...req.body,
    status: req.body.status,
    admin_note: req.body.admin_note
  };
  return exports.updateOrder(req, res);
};
