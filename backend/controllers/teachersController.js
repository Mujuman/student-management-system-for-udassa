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
        t.*,
        u.username,
        u.email as user_email,
        u.created_at,
        u.updated_at
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.first_name ASC, t.last_name ASC
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
        t.*,
        u.username,
        u.email as user_email,
        u.created_at,
        u.updated_at
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
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

    // Validate required fields
    if (!first_name || !last_name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: first_name, last_name, email, username, password',
      });
    }

    // Check if username already exists
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

    // Check if email already exists
    const [existingEmails] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account
    const [userResult] = await conn.execute(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, 'teacher']
    );

    const userId = userResult.insertId;

    // Create teacher record
    const [teacherResult] = await conn.execute(
      `INSERT INTO teachers 
       (user_id, first_name, last_name, email, phone_number, subject_specialization, hire_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, first_name, last_name, email, phone_number, subject_specialization, hire_date]
    );

    await conn.commit();

    Logger.info('Teacher created successfully', { 
      teacherId: teacherResult.insertId,
      username,
      email 
    });

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: teacherResult.insertId,
        user_id: userId,
        first_name,
        last_name,
        email,
        username,
      },
    });

  } catch (error) {
    await conn.rollback();
    Logger.error('Error creating teacher:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email or username already exists',
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

    // Check if teacher exists
    const [existingTeacher] = await conn.execute(
      'SELECT user_id FROM teachers WHERE id = ?',
      [id]
    );

    if (existingTeacher.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const userId = existingTeacher[0].user_id;

    // Update teacher record
    await conn.execute(
      `UPDATE teachers 
       SET first_name = ?, last_name = ?, email = ?, phone_number = ?, 
           subject_specialization = ?, hire_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [first_name, last_name, email, phone_number, subject_specialization, hire_date, id]
    );

    // Update user record if username or email provided
    if (username || email) {
      const updateFields = [];
      const updateValues = [];
      
      if (username) {
        // Check if username is already taken by another user
        const [existingUsers] = await conn.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId]
        );
        
        if (existingUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Username already exists',
          });
        }
        
        updateFields.push('username = ?');
        updateValues.push(username);
      }
      
      if (email) {
        // Check if email is already taken by another user
        const [existingEmails] = await conn.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        
        if (existingEmails.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists',
          });
        }
        
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(userId);
        
        await conn.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
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

    // Check if teacher exists
    const [existingTeacher] = await conn.execute(
      'SELECT user_id FROM teachers WHERE id = ?',
      [id]
    );

    if (existingTeacher.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const userId = existingTeacher[0].user_id;

    // Delete teacher record (this will cascade to related records)
    await conn.execute('DELETE FROM teachers WHERE id = ?', [id]);
    
    // Delete user account
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);

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