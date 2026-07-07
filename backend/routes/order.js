const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  restoreOrder
} = require('../controllers/order');
const { isAuthenticatedUser, isAdmin, isCustomer } = require('../middlewares/auth');

router.post('/orders', isAuthenticatedUser, createOrder);
router.get('/orders/my', isCustomer, getUserOrders);
router.get('/orders', isAdmin, getAllOrders);
router.get('/orders/:id', isAuthenticatedUser, getOrderById);
router.put('/orders/:id', isAdmin, updateOrder);
router.put('/orders/:id/status', isAdmin, updateOrderStatus);
router.delete('/orders/:id', isAdmin, deleteOrder);
router.put('/orders/:id/restore', isAdmin, restoreOrder);

module.exports = router;
