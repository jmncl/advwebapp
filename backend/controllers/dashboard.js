const db = require('../models');
const Order = db.Order;
const Product = db.Product;
const User = db.User;
const OrderItem = db.OrderItem;
const { Op } = require('sequelize');
const { computeOrderTotal } = require('../utils/orderTotals');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.count({ where: { deleted_at: null } });
    const totalUsers = await User.count({ where: { deleted_at: null } });
    const totalOrders = await Order.count({ where: { deleted_at: null } });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueOrders = await Order.findAll({
      where: {
        deleted_at: null,
        status: { [Op.in]: ['Delivered', 'Shipped'] }
      },
      include: [{
        model: OrderItem,
        include: [{ model: Product, attributes: ['unit_price', 'category'] }]
      }]
    });

    let totalRevenue = 0;
    revenueOrders.forEach((order) => {
      totalRevenue += computeOrderTotal(order);
    });

    const chartOrders = await Order.findAll({
      where: {
        deleted_at: null,
        createdAt: { [Op.gte]: sixMonthsAgo },
        status: { [Op.in]: ['Delivered', 'Shipped', 'Processing'] }
      },
      include: [{
        model: OrderItem,
        include: [{ model: Product, attributes: ['unit_price', 'category'] }]
      }]
    });

    const orders = chartOrders.map((o) => ({
      createdAt: o.createdAt,
      computed_total: computeOrderTotal(o)
    }));

    const categorySales = await OrderItem.findAll({
      include: [{ model: Product, attributes: ['category', 'unit_price'] }],
      attributes: ['quantity']
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue
      },
      orders,
      categorySales
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};
