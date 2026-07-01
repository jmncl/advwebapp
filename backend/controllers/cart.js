const db = require('../models');
const Cart = db.Cart;
const Product = db.Product;
const { Op } = require('sequelize');

const activeCartWhere = (userId) => ({
  user_id: userId,
  deleted_at: null
});

exports.getCart = async (req, res) => {
  try {
    const userId = req.body.user.id;
    const items = await Cart.findAll({
      where: activeCartWhere(userId),
      include: [{ model: Product, where: { deleted_at: null }, required: true }]
    });
    return res.status(200).json({ rows: items });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching cart' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.body.user.id;
    const { product_id, quantity, size } = req.body;

    const product = await Product.findOne({ where: { id: product_id, deleted_at: null } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let cartItem = await Cart.findOne({ where: { user_id: userId, product_id } });

    if (cartItem) {
      if (cartItem.deleted_at) {
        await cartItem.update({
          deleted_at: null,
          quantity: quantity || 1,
          size: size || product.size
        });
      } else {
        await cartItem.update({
          quantity: cartItem.quantity + (quantity || 1),
          size: size || cartItem.size
        });
      }
    } else {
      cartItem = await Cart.create({
        user_id: userId,
        product_id,
        quantity: quantity || 1,
        size: size || product.size
      });
    }

    return res.status(200).json({ success: true, message: 'Added to cart', cartItem });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error adding to cart' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.body.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

    await Cart.update({ quantity }, { where: { id, user_id: userId, deleted_at: null } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error updating cart' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.body.user.id;
    await Cart.update(
      { deleted_at: new Date() },
      { where: { id: req.params.id, user_id: userId, deleted_at: null } }
    );
    return res.status(200).json({ success: true, message: 'Removed from cart' });
  } catch (err) {
    return res.status(500).json({ error: 'Error removing from cart' });
  }
};

exports.restoreCartItem = async (req, res) => {
  try {
    const userId = req.body.user.id;
    const item = await Cart.findOne({ where: { id: req.params.id, user_id: userId } });
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    if (!item.deleted_at) return res.status(400).json({ error: 'Cart item is not in trash' });

    await item.update({ deleted_at: null });
    return res.status(200).json({ success: true, message: 'Cart item restored' });
  } catch (err) {
    return res.status(500).json({ error: 'Error restoring cart item' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.body.user.id;
    await Cart.update(
      { deleted_at: new Date() },
      { where: { user_id: userId, deleted_at: null } }
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error clearing cart' });
  }
};

exports.getTrashedCart = async (req, res) => {
  try {
    const userId = req.body.user.id;
    const items = await Cart.findAll({
      where: { user_id: userId, deleted_at: { [Op.ne]: null } },
      include: [{ model: Product }],
      order: [['deleted_at', 'DESC']]
    });
    return res.status(200).json({ rows: items });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching trashed cart items' });
  }
};
