const express = require('express');
const rateLimit = require('express-rate-limit');
const { authValidation } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const {
  signup,
  login,
  logout,
  getMe,
  updateMe,
} = require('../controllers/authController');

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/signup', authLimiter, authValidation.register, signup);
router.post('/login', authLimiter, authValidation.login, login);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/me', updateMe);

module.exports = router;