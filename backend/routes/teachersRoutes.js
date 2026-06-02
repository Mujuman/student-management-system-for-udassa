const express = require('express');
const router = express.Router();

const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teachersController');

const { authenticateToken } = require('../middleware/authMiddleware');
const {
  validateTeacher,
  validateUpdateTeacher,
  handleValidationErrors,
} = require('../middleware/validationMiddleware');

// ==========================================
// TEACHERS ROUTES
// ==========================================

// GET /api/teachers - Get all teachers
router.get('/', authenticateToken, getAllTeachers);

// GET /api/teachers/:id - Get teacher by ID
router.get('/:id', authenticateToken, getTeacherById);

// POST /api/teachers - Create new teacher
router.post('/',
  authenticateToken,
  validateTeacher,
  handleValidationErrors,
  createTeacher
);

// PUT /api/teachers/:id - Update teacher
router.put('/:id',
  authenticateToken,
  validateUpdateTeacher,
  handleValidationErrors,
  updateTeacher
);

// DELETE /api/teachers/:id - Delete teacher
router.delete('/:id', authenticateToken, deleteTeacher);

module.exports = router;