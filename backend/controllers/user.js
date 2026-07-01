const db = require('../models');
const User = db.User;
const Customer = db.Customer;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.log(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Error registering user' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email, deleted_at: null, is_active: 1 } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    await user.update({ token });

    return res.status(200).json({
      success: true,
      message: 'Welcome back',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error logging in' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fname, lname, addressline, zipcode, phone, userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    let image_path = null;
    if (req.file) image_path = req.file.path.replace(/\\/g, '/');

    const [customer, created] = await Customer.findOrCreate({
      where: { user_id: userId },
      defaults: { fname, lname, addressline, zipcode, phone, image_path, user_id: userId }
    });

    if (!created) {
      await customer.update({
        fname: fname || customer.fname,
        lname: lname || customer.lname,
        addressline: addressline || customer.addressline,
        zipcode: zipcode || customer.zipcode,
        phone: phone || customer.phone,
        image_path: image_path || customer.image_path
      });
    }

    return res.status(200).json({ success: true, message: 'Profile updated', customer });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error updating profile' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { trashed } = req.query;
    const where = trashed === '1'
      ? { deleted_at: { [Op.ne]: null } }
      : { deleted_at: null };

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password', 'token'] },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ rows: users });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching users' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await User.update({ role }, { where: { id, deleted_at: null } });
    return res.status(200).json({ success: true, message: 'Role updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Error updating role' });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.deleted_at) return res.status(400).json({ error: 'User is already in trash' });

    await user.update({ is_active: 0, deleted_at: new Date() });
    return res.status(200).json({ success: true, message: 'User moved to trash' });
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting user' });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.deleted_at) return res.status(400).json({ error: 'User is not in trash' });

    await user.update({ is_active: 1, deleted_at: null });
    return res.status(200).json({ success: true, message: 'User restored' });
  } catch (err) {
    return res.status(500).json({ error: 'Error restoring user' });
  }
};
