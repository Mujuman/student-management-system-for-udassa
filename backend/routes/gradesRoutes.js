const express = require('express');
const router = express.Router();
const {
  syncGrades,
  getStudentGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade
} = require('../controllers/gradesController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// GET /api/grades/sync - Sync grades for offline mobile app
router.get('/sync', authenticateToken, syncGrades);

// GET /api/grades/student/:studentId
router.get('/student/:studentId', authenticateToken, getStudentGrades);

// GET /api/grades/:gradeId
router.get('/:gradeId', authenticateToken, getGradeById);

// POST /api/grades - Create a new grade record
router.post('/', authenticateToken, authorizeRoles('teacher', 'admin'), createGrade);

// PUT /api/grades/:gradeId - Update a grade record
router.put('/:gradeId', authenticateToken, authorizeRoles('teacher', 'admin'), updateGrade);

// DELETE /api/grades/:gradeId - Delete a grade record
router.delete('/:gradeId', authenticateToken, authorizeRoles('teacher', 'admin'), deleteGrade);

module.exports = router;