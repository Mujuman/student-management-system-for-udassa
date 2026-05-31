const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getStudents);
router.post('/', authenticateToken, authorizeRoles('admin'), createStudent);
router.put('/:studentId', authenticateToken, authorizeRoles('admin'), updateStudent);
router.delete('/:studentId', authenticateToken, authorizeRoles('admin'), deleteStudent);
router.get('/:studentId', authenticateToken, getStudentById);

module.exports = router;
