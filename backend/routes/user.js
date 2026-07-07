const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerification,
  updateProfile,
  getAllUsers,
  updateUserRole,
  deactivateUser,
  restoreUser
} = require('../controllers/user');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', loginUser);
router.post('/logout', isAuthenticatedUser, logoutUser);
router.put('/profile', isAuthenticatedUser, upload.single('image'), updateProfile);
router.get('/users', isAdmin, getAllUsers);
router.put('/users/:id/role', isAdmin, updateUserRole);
router.put('/users/:id/status', isAdmin, deactivateUser);
router.put('/users/:id/restore', isAdmin, restoreUser);

module.exports = router;
