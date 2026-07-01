const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  restoreOrder
} = require('../controllers/order');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.post('/orders', isAuthenticatedUser, createOrder);
router.get('/orders/my', isAuthenticatedUser, getUserOrders);
router.get('/orders', isAdmin, getAllOrders);
router.put('/orders/:id/status', isAdmin, updateOrderStatus);
router.delete('/orders/:id', isAdmin, deleteOrder);
router.put('/orders/:id/restore', isAdmin, restoreOrder);

module.exports = router;
