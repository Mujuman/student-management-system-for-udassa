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

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateStudentCreate = [
  body('first_name').exists().withMessage('first_name is required').isLength({ min: 1 }).trim().escape(),
  body('last_name').exists().withMessage('last_name is required').isLength({ min: 1 }).trim().escape(),
  body('roll_number').exists().withMessage('roll_number is required').isLength({ min: 1 }).trim().escape(),
  body('class_id').exists().withMessage('class_id is required').isInt().toInt(),
  body('username').optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9_]+$/).withMessage('username must contain only letters, numbers, and underscores').trim(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  handleValidationErrors
];

const validateStudentUpdate = [
  body('first_name').optional({ checkFalsy: true }).isLength({ min: 1 }).trim().escape(),
  body('last_name').optional({ checkFalsy: true }).isLength({ min: 1 }).trim().escape(),
  body('roll_number').optional({ checkFalsy: true }).isLength({ min: 1 }).trim().escape(),
  body('class_id').optional({ checkFalsy: true }).isInt().toInt(),
  body('username').optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9_]+$/).withMessage('username must contain only letters, numbers, and underscores').trim(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('status').optional({ checkFalsy: true }).isIn(['Active', 'Inactive', 'Graduated', 'Transferred']).withMessage('status must be Active, Inactive, Graduated, or Transferred'),
  handleValidationErrors
];

const validateLogin = [
  body('username').exists().withMessage('username is required').trim().notEmpty(),
  body('password').exists().withMessage('password is required').trim().notEmpty(),
  handleValidationErrors
];

const validateAttendance = [
  body('attendanceRecords').isArray({ min: 1 }).withMessage('attendanceRecords must be a non-empty array'),
  body('attendanceRecords.*.student_id').isInt({ gt: 0 }).withMessage('student_id must be a valid integer'),
  body('attendanceRecords.*.class_id').isInt({ gt: 0 }).withMessage('class_id must be a valid integer'),
  body('attendanceRecords.*.date').isISO8601().withMessage('date must be a valid ISO date'),
  body('attendanceRecords.*.status').isIn(['Present', 'Absent', 'Late', 'Excused']).withMessage('status must be Present, Absent, Late, or Excused'),
  body('attendanceRecords.*.remarks').optional({ checkFalsy: true }).trim().escape(),
  handleValidationErrors
];

const validateGradeCreate = [
  body('student_id').exists().withMessage('student_id is required').isInt({ gt: 0 }).toInt(),
  body('subject_name').exists().withMessage('subject_name is required').trim().escape(),
  body('quiz_mark').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('assignment_mark').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('exam_mark').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('max_marks').optional({ checkFalsy: true }).isFloat({ min: 1 }).toFloat(),
  body('semester').exists().withMessage('semester is required').isIn(['1', '2', 'Annual']).withMessage('semester must be 1, 2 or Annual'),
  body('academic_year').exists().withMessage('academic_year is required').trim().escape(),
  body('remarks').optional({ checkFalsy: true }).trim().escape(),
  handleValidationErrors
];

const validateGradeUpdate = [
  body('student_id').optional({ checkFalsy: true }).isInt({ gt: 0 }).toInt(),
  body('subject_name').optional({ checkFalsy: true }).trim().escape(),
  body('quiz_mark').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('assignment_mark').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('exam_mark').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('max_marks').optional({ checkFalsy: true }).isFloat({ min: 1 }).toFloat(),
  body('semester').optional({ checkFalsy: true }).isIn(['1', '2', 'Annual']).withMessage('semester must be 1, 2 or Annual'),
  body('academic_year').optional({ checkFalsy: true }).trim().escape(),
  body('remarks').optional({ checkFalsy: true }).trim().escape(),
  handleValidationErrors
];

const validateTeacher = [
  body('first_name').exists().withMessage('first_name is required').isLength({ min: 1 }).trim().escape(),
  body('last_name').exists().withMessage('last_name is required').isLength({ min: 1 }).trim().escape(),
  body('email').exists().withMessage('email is required').isEmail().normalizeEmail(),
  body('username').exists().withMessage('username is required').matches(/^[a-zA-Z0-9_]+$/).withMessage('username must contain only letters, numbers, and underscores').trim(),
  body('password').exists().withMessage('password is required').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('phone_number').optional({ checkFalsy: true }).trim().escape(),
  body('subject_specialization').optional({ checkFalsy: true }).trim().escape(),
  body('hire_date').optional({ checkFalsy: true }).isISO8601().withMessage('hire_date must be a valid date'),
  handleValidationErrors
];

const validateUpdateTeacher = [
  body('first_name').optional({ checkFalsy: true }).isLength({ min: 1 }).trim().escape(),
  body('last_name').optional({ checkFalsy: true }).isLength({ min: 1 }).trim().escape(),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('username').optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9_]+$/).withMessage('username must contain only letters, numbers, and underscores').trim(),
  body('phone_number').optional({ checkFalsy: true }).trim().escape(),
  body('subject_specialization').optional({ checkFalsy: true }).trim().escape(),
  body('hire_date').optional({ checkFalsy: true }).isISO8601().withMessage('hire_date must be a valid date'),
  handleValidationErrors
];

module.exports = { 
  sanitizeBody, 
  handleValidationErrors,
  validateStudentCreate, 
  validateStudentUpdate, 
  validateLogin, 
  validateAttendance, 
  validateGradeCreate, 
  validateGradeUpdate,
  validateTeacher,
  validateUpdateTeacher
};
