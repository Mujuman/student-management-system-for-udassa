const db = require('../config/database');
const bcrypt = require('bcrypt');
const Logger = require('../utils/logger');

const getStudents = async (req, res) => {
  try {
    const { classId } = req.query;
    const params = [];

    let query = `SELECT
      s.id,
      s.first_name,
      s.last_name,
      s.roll_number,
      s.gender,
      DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
      s.status,
      c.id AS class_id,
      c.class_name AS class_name,
      c.section
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id`;

    if (req.user.role === 'student') {
      query += ' WHERE s.user_id = ?';
      params.push(req.user.id);
    } else if (classId) {
      query += ' WHERE s.class_id = ?';
      params.push(classId);
    }

    query += ' ORDER BY c.class_name ASC, c.section ASC, s.roll_number ASC';
    Logger.info('Students query', query);

    const [students] = await db.query(query, params);

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully.',
      data: students
    });
  } catch (error) {
    Logger.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving student data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [students] = await db.query(
      `SELECT
        s.id,
        s.user_id,
        s.first_name,
        s.last_name,
        s.roll_number,
        s.gender,
        DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
        s.status,
        c.id AS class_id,
        c.class_name AS class_name,
        c.section
      FROM students s
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE s.id = ?
      LIMIT 1`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    if (req.user.role === 'student' && students[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students can only view their own profile.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully.',
      data: students[0]
    });
  } catch (error) {
    Logger.error('Get student by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the student.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      username,
      password,
      first_name,
      last_name,
      roll_number,
      class_id,
      gender,
      date_of_birth,
      address,
      phone_number,
      email,
      status
    } = req.body;

    if (!username || !first_name || !last_name || !roll_number || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'username, first_name, last_name, roll_number, and class_id are required.'
      });
    }

    const passwordHash = await bcrypt.hash(password || 'Student123!', 10);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      'INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)',
      [username, passwordHash, 'student', 1]
    );

    const [studentResult] = await connection.query(
      `INSERT INTO students
        (user_id, first_name, last_name, roll_number, class_id, gender, date_of_birth, address, phone_number, email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        first_name,
        last_name,
        roll_number,
        class_id,
        gender || null,
        date_of_birth || null,
        address || null,
        phone_number || null,
        email || null,
        status || 'Active'
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      data: {
        id: studentResult.insertId,
        user_id: userResult.insertId,
        username,
        first_name,
        last_name,
        roll_number,
        class_id: Number(class_id),
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        status: status || 'Active'
      }
    });
  } catch (error) {
    await connection.rollback();
    Logger.error('Create student error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A student or user with this username or roll number already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the student.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

module.exports = { getStudents, getStudentById, createStudent };
