const express = require('express');
const router = express.Router();
const { submitAttendance, getAttendanceByClassAndDate, getAttendanceByStudent } = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateAttendance } = require('../middleware/validationMiddleware');

// POST /api/attendance - Submit attendance (Teacher only)
router.post('/', authenticateToken, authorizeRoles('teacher'), validateAttendance, submitAttendance);

// GET /api/attendance/class/:classId/date/:date
router.get('/class/:classId/date/:date', authenticateToken, getAttendanceByClassAndDate);

// GET /api/attendance/student/:studentId - Get student attendance
router.get('/student/:studentId', authenticateToken, getAttendanceByStudent);

module.exports = router;
