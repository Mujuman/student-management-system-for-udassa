const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { sanitizeBody, validateStudentCreate, validateStudentUpdate } = require('../middleware/validationMiddleware');

router.get('/', authenticateToken, getStudents);
router.post('/', authenticateToken, authorizeRoles('admin'), sanitizeBody, validateStudentCreate, createStudent);
router.put('/:studentId', authenticateToken, authorizeRoles('admin'), sanitizeBody, validateStudentUpdate, updateStudent);
router.delete('/:studentId', authenticateToken, authorizeRoles('admin'), sanitizeBody, deleteStudent);
router.get('/:studentId', authenticateToken, getStudentById);

module.exports = router;
