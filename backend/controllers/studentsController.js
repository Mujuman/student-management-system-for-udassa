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

    // Pre-check for existing username or roll number to return friendlier errors
    const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    const [existingStudents] = await db.query('SELECT id FROM students WHERE roll_number = ? LIMIT 1', [roll_number]);
    if (existingStudents.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Roll number already exists. Please provide a unique roll number.'
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

const updateStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { studentId } = req.params;
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

    await connection.beginTransaction();

    const [students] = await connection.query('SELECT * FROM students WHERE id = ? LIMIT 1', [studentId]);
    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = students[0];
    const userId = student.user_id;

    // Update users table if username or password provided
    if (username !== undefined || password !== undefined) {
      const userFields = [];
      const userParams = [];
      if (username !== undefined) {
        userFields.push('username = ?');
        userParams.push(username);
      }
      if (password !== undefined && password !== '') {
        const passwordHash = await bcrypt.hash(password, 10);
        userFields.push('password_hash = ?');
        userParams.push(passwordHash);
      }

      if (userFields.length > 0) {
        userParams.push(userId);
        await connection.query(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userParams);
      }
    }

    // Update students table
    const fields = [];
    const params = [];
    if (first_name !== undefined) { fields.push('first_name = ?'); params.push(first_name); }
    if (last_name !== undefined) { fields.push('last_name = ?'); params.push(last_name); }
    if (roll_number !== undefined) { fields.push('roll_number = ?'); params.push(roll_number); }
    if (class_id !== undefined) { fields.push('class_id = ?'); params.push(class_id); }
    if (gender !== undefined) { fields.push('gender = ?'); params.push(gender); }
    if (date_of_birth !== undefined) { fields.push('date_of_birth = ?'); params.push(date_of_birth); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (phone_number !== undefined) { fields.push('phone_number = ?'); params.push(phone_number); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length > 0) {
      params.push(studentId);
      await connection.query(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    await connection.commit();

    const [updatedRows] = await db.query(
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

    res.status(200).json({ success: true, message: 'Student updated successfully.', data: updatedRows[0] });
  } catch (error) {
    await connection.rollback();
    Logger.error('Update student error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A student with this roll number or username already exists.' });
    }
    res.status(500).json({ success: false, message: 'An error occurred while updating the student.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  } finally {
    connection.release();
  }
};

const deleteStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { studentId } = req.params;
    await connection.beginTransaction();

    const [students] = await connection.query('SELECT * FROM students WHERE id = ? LIMIT 1', [studentId]);
    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const userId = students[0].user_id;

    // Delete student record
    const [delResult] = await connection.query('DELETE FROM students WHERE id = ?', [studentId]);

    // Also delete associated user account (if exists)
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();

    res.status(200).json({ success: true, message: 'Student and associated user account deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    Logger.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the student.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  } finally {
    connection.release();
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
