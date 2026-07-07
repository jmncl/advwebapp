const jwt = require('jsonwebtoken');
const db = require('../models');

const authenticateToken = async (req, { requireAdmin = false } = {}) => {
  if (!req.header('Authorization')) {
    return { error: { status: 401, message: 'Login first to access this resource' } };
  }

  const token = req.header('Authorization').split(' ')[1];
  if (!token) {
    return { error: { status: 401, message: 'Login first' } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findOne({
      where: { id: decoded.id, deleted_at: null, is_active: 1 }
    });

    if (!user || user.token !== token) {
      return { error: { status: 401, message: 'Invalid or expired token' } };
    }

    if (requireAdmin && user.role !== 'admin') {
      return { error: { status: 403, message: 'Admin access required' } };
    }

    return { user };
  } catch (err) {
    return { error: { status: 401, message: 'Invalid or expired token' } };
  }
};

const attachUser = (req, user) => {
  req.authUser = { id: user.id, role: user.role };
  req.body = req.body || {};
  req.body.user = req.authUser;
};

exports.isAuthenticatedUser = async (req, res, next) => {
  const result = await authenticateToken(req);
  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  attachUser(req, result.user);
  next();
};

exports.isAdmin = async (req, res, next) => {
  const result = await authenticateToken(req, { requireAdmin: true });
  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  attachUser(req, result.user);
  next();
};

exports.isCustomer = async (req, res, next) => {
  const result = await authenticateToken(req);
  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  if (result.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access only' });
  }

  attachUser(req, result.user);
  next();
};
