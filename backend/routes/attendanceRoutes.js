const express = require('express');
const router = express.Router();
const { submitAttendance, getAttendanceByClassAndDate } = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// POST /api/attendance - Submit attendance (Teacher only)
router.post('/', authenticateToken, authorizeRoles('teacher'), submitAttendance);

// GET /api/attendance/class/:classId/date/:date
router.get('/class/:classId/date/:date', authenticateToken, getAttendanceByClassAndDate);

module.exports = router;
