const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  restoreCartItem,
  clearCart,
  getTrashedCart
} = require('../controllers/cart');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.get('/cart', isAuthenticatedUser, getCart);
router.get('/cart/trash', isAuthenticatedUser, getTrashedCart);
router.post('/cart', isAuthenticatedUser, addToCart);
router.put('/cart/:id', isAuthenticatedUser, updateCartItem);
router.put('/cart/:id/restore', isAuthenticatedUser, restoreCartItem);
router.delete('/cart/:id', isAuthenticatedUser, removeFromCart);
router.delete('/cart', isAuthenticatedUser, clearCart);

module.exports = router;
