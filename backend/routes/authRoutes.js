const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { login } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validationMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, login);

module.exports = router;