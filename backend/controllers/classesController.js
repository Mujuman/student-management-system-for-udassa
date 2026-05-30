const db = require('../config/database');
const Logger = require('../utils/logger');

const getClasses = async (req, res) => {
  try {
    const [classes] = await db.query(
      `SELECT
        c.id,
        c.class_name AS name,
        c.academic_year,
        c.section,
        c.room_number,
        c.capacity,
        c.is_active
      FROM classes c
      ORDER BY c.class_name ASC, c.section ASC`
    );

    res.status(200).json({
      success: true,
      message: 'Classes retrieved successfully.',
      data: classes
    });
  } catch (error) {
    Logger.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving class data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { getClasses };
