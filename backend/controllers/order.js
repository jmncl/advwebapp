const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const User = db.User;
const sendEmail = require('../utils/sendEmail');
const { generateOrderReceipt } = require('../utils/generatePDF');
const { computeOrderTotal, enrichOrder, enrichOrders } = require('../utils/orderTotals');
const { Op } = require('sequelize');

const orderIncludes = [{
  model: OrderItem,
  include: [{ model: Product, attributes: ['id', 'name', 'item_code', 'image_url', 'unit_price', 'category'] }]
}];

exports.createOrder = async (req, res) => {
  try {
    const { cart, shipping_address, payment_method } = req.body;
    const userId = req.body.user.id;

    if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    if (!shipping_address) return res.status(400).json({ error: 'Shipping address required' });

    for (const item of cart) {
      const product = await Product.findByPk(item.product_id);
      if (!product) return res.status(404).json({ error: `Product ${item.product_id} not found` });
    }

    const order = await Order.create({
      user_id: userId,
      shipping_address,
      payment_method: payment_method || 'Cash on Delivery',
      status: 'Pending'
    });

    for (const item of cart) {
      const product = await Product.findByPk(item.product_id);
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size || product.size
      });
      await Product.update(
        { stock_quantity: Math.max(0, product.stock_quantity - item.quantity) },
        { where: { id: item.product_id } }
      );
    }

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: User }, ...orderIncludes]
    });
    const enriched = enrichOrder(fullOrder);
    const total = enriched.computed_total;

    try {
      await sendEmail({
        email: fullOrder.User.email,
        subject: 'Order Confirmed - Jordan Brand Store',
        message: `Your order #${order.id} has been placed successfully! Total: ₱${total.toFixed(2)}`
      });
    } catch (emailErr) {
      console.log('Email error (configure Mailtrap in .env):', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      order_id: order.id,
      computed_total: total,
      message: 'Order placed successfully'
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error creating order', details: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.body.user.id;
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
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      where: { id: req.params.id, deleted_at: null },
      include: [{ model: User }, ...orderIncludes]
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    await order.update({ status });

    const enriched = enrichOrder(order);
    let itemsHtml = '';
    if (enriched.OrderItems) {
      enriched.OrderItems.forEach((item) => {
        itemsHtml += `<li>${item.Product ? item.Product.name : 'Product'} x${item.quantity} - ₱${item.computed_subtotal.toFixed(2)}</li>`;
      });
    }

    try {
      const pdfBuffer = await generateOrderReceipt(enriched);
      await sendEmail({
        email: order.User.email,
        subject: `Order #${order.id} Status Update - Jordan Brand Store`,
        html: `<p>Hi ${order.User.name}, your order <strong>#${order.id}</strong> status has been updated to: <strong>${status}</strong>.</p>
               <ul>${itemsHtml}</ul>
               <p><strong>Grand Total: ₱${enriched.computed_total.toFixed(2)}</strong></p>`,
        attachments: [{ filename: `receipt-order-${order.id}.pdf`, content: pdfBuffer }]
      });
    } catch (emailErr) {
      console.log('Email error (configure Mailtrap in .env):', emailErr.message);
    }

    return res.status(200).json({ success: true, message: 'Order status updated' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error updating order status' });
  }
};
