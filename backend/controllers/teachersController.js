const bcrypt = require('bcrypt');
const connection = require('../config/database');
const Logger = require('../utils/logger');

// ==========================================
// GET ALL TEACHERS
// ==========================================
const getAllTeachers = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        username,
        email,
        first_name,
        last_name,
        phone_number,
        subject_specialization,
        DATE_FORMAT(hire_date, '%Y-%m-%d') AS hire_date,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE role = 'teacher'
      ORDER BY first_name ASC, last_name ASC
    `;

    const [teachers] = await connection.execute(query);

    Logger.info('Teachers retrieved successfully', { count: teachers.length });

    res.status(200).json({
      success: true,
      message: 'Teachers retrieved successfully',
      data: teachers,
    });
  } catch (error) {
    Logger.error('Error getting teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// ==========================================
// GET TEACHER BY ID
// ==========================================
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        username,
        email,
        first_name,
        last_name,
        phone_number,
        subject_specialization,
        DATE_FORMAT(hire_date, '%Y-%m-%d') AS hire_date,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = ? AND role = 'teacher'
      LIMIT 1
    `;

    const [teachers] = await connection.execute(query, [id]);

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    Logger.info('Teacher retrieved successfully', { teacherId: id });

    res.status(200).json({
      success: true,
      message: 'Teacher retrieved successfully',
      data: teachers[0],
    });
  } catch (error) {
    Logger.error('Error getting teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// ==========================================
// CREATE NEW TEACHER
// ==========================================
const createTeacher = async (req, res) => {
  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    const {
      first_name,
      last_name,
      email,
      phone_number,
      subject_specialization,
      hire_date,
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: username and password',
      });
    }

    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [userResult] = await conn.execute(
      'INSERT INTO users (username, password_hash, role, is_active, email, first_name, last_name, phone_number, subject_specialization, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, 'teacher', 1, email || null, first_name || null, last_name || null, phone_number || null, subject_specialization || null, hire_date || null]
    );

    await conn.commit();

    Logger.info('Teacher created successfully', {
      userId: userResult.insertId,
      username,
      email,
    });

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: userResult.insertId,
        username,
        email,
        first_name,
        last_name,
        phone_number,
        subject_specialization,
        hire_date,
      },
    });
  } catch (error) {
    await conn.rollback();
    Logger.error('Error creating teacher:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this username or email already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

// ==========================================
// UPDATE TEACHER
// ==========================================
const updateTeacher = async (req, res) => {
  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone_number,
      subject_specialization,
      hire_date,
      username,
    } = req.body;

    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'teacher']
    );

    if (existingUsers.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (username) {
      const [existingUsersWithUsername] = await conn.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      if (existingUsersWithUsername.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
      }
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (email) {
      const [existingUsersWithEmail] = await conn.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (existingUsersWithEmail.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (phone_number !== undefined) {
      updateFields.push('phone_number = ?');
      updateValues.push(phone_number);
    }
    if (subject_specialization !== undefined) {
      updateFields.push('subject_specialization = ?');
      updateValues.push(subject_specialization);
    }
    if (hire_date !== undefined) {
      updateFields.push('hire_date = ?');
      updateValues.push(hire_date);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      await conn.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    await conn.commit();

    Logger.info('Teacher updated successfully', { teacherId: id });

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    await conn.rollback();
    Logger.error('Error updating teacher:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

// ==========================================
// DELETE TEACHER
// ==========================================
const deleteTeacher = async (req, res) => {
  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;

    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'teacher']
    );

    if (existingUsers.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    await conn.execute('DELETE FROM users WHERE id = ?', [id]);

    await conn.commit();

    Logger.info('Teacher deleted successfully', { teacherId: id });

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    await conn.rollback();
    Logger.error('Error deleting teacher:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};