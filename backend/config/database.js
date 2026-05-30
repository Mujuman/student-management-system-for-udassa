const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Create MySQL connection pool for high performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_management_system',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('Database Connection Failed:', error.message);
    process.exit(1);
  }
})();

module.exports = pool;
