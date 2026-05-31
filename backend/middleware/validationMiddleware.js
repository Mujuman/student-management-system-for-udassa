const { body, validationResult } = require('express-validator');
const Logger = require('../utils/logger');

// Generic sanitizer: strips HTML tags and trims strings
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (typeof val === 'string') {
      // remove any HTML tags and control characters
      obj[key] = val.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
    } else if (typeof val === 'object' && val !== null) {
      sanitizeObject(val);
    }
  });
};

const sanitizeBody = (req, res, next) => {
  try {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
  } catch (err) {
    Logger.warn('Sanitization error', err);
  }
  next();
};

const validateStudent = [
  body('first_name').exists().withMessage('first_name is required').isLength({ min: 1 }).trim().escape(),
  body('last_name').exists().withMessage('last_name is required').isLength({ min: 1 }).trim().escape(),
  body('roll_number').exists().withMessage('roll_number is required').isLength({ min: 1 }).trim().escape(),
  body('class_id').exists().withMessage('class_id is required').isInt().toInt(),
  body('username').optional({ checkFalsy: true }).isAlphanumeric().withMessage('username must be alphanumeric').trim(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = { sanitizeBody, validateStudent };
