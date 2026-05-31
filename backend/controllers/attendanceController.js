const db = require('../config/database');
const Logger = require('../utils/logger');

// POST /api/attendance - Submit attendance records (supports bulk insert)
const submitAttendance = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { attendanceRecords } = req.body;
    const teacherId = req.user.id; // From JWT token

    // Validate input
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance records array is required and must not be empty.'
      });
    }

    await connection.beginTransaction();

    const insertedRecords = [];
    const errors = [];

    for (const record of attendanceRecords) {
      const { student_id, class_id, date, status, remarks } = record;

      // Validate required fields
      if (!student_id || !class_id || !date || !status) {
        errors.push({
          student_id,
          error: 'Missing required fields: student_id, class_id, date, status'
        });
        continue;
      }

      // Validate status
      const validStatuses = ['Present', 'Absent', 'Late', 'Excused'];
      if (!validStatuses.includes(status)) {
        errors.push({
          student_id,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        continue;
      }

      try {
        // Use INSERT ... ON DUPLICATE KEY UPDATE for idempotency
        const [result] = await connection.query(
          `INSERT INTO attendance (student_id, class_id, date, status, marked_by_teacher_id, remarks)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           marked_by_teacher_id = VALUES(marked_by_teacher_id),
           remarks = VALUES(remarks),
           updated_at = CURRENT_TIMESTAMP`,
          [student_id, class_id, date, status, teacherId, remarks || null]
        );

        insertedRecords.push({
          student_id,
          class_id,
          date,
          status,
          id: result.insertId || 'updated'
        });

      } catch (insertError) {
        Logger.error(`Error inserting attendance for student ${student_id}:`, insertError);
        errors.push({
          student_id,
          error: insertError.message
        });
      }
    }

    await connection.commit();

    Logger.success(`Attendance submitted: ${insertedRecords.length} records processed`);

    res.status(201).json({
      success: true,
      message: `Successfully processed ${insertedRecords.length} attendance record(s).`,
      data: {
        inserted: insertedRecords,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    await connection.rollback();
    Logger.error('Submit attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting attendance.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// GET /api/attendance/class/:classId/date/:date - Get attendance for a specific class and date
const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.params;

    const [attendance] = await db.query(
      `SELECT 
        a.id,
        a.student_id,
        s.first_name,
        s.last_name,
        s.roll_number,
        a.status,
        a.remarks,
        a.date,
        a.created_at
      FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      WHERE a.class_id = ? AND a.date = ?
      ORDER BY s.roll_number ASC`,
      [classId, date]
    );

    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully.',
      data: attendance
    });

  } catch (error) {
    Logger.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving attendance.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/attendance/student/:studentId - Get all attendance records for a student
const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if user is a student and can only view their own attendance
    if (req.user.role === 'student') {
      const [students] = await db.query('SELECT id FROM students WHERE id = ? AND user_id = ?', [studentId, req.user.id]);
      if (students.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Students can only view their own attendance.'
        });
      }
    }

    const [attendance] = await db.query(
      `SELECT 
        a.id,
        a.date,
        a.status,
        a.remarks,
        c.class_name,
        c.section,
        a.created_at
      FROM attendance a
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC`,
      [studentId]
    );

    res.status(200).json({
      success: true,
      message: 'Student attendance records retrieved successfully.',
      data: attendance
    });

  } catch (error) {
    Logger.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving student attendance.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { submitAttendance, getAttendanceByClassAndDate, getAttendanceByStudent };