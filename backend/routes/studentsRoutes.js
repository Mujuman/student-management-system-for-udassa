const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent } = require('../controllers/studentsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getStudents);
router.post('/', authenticateToken, authorizeRoles('admin'), createStudent);
router.get('/:studentId', authenticateToken, getStudentById);

module.exports = router;
