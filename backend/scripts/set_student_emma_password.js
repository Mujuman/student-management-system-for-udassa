const db = require('../config/database');

(async () => {
  try {
    const hash = '$2b$10$syCyeUDTthOMhBUCAeq2POwAZmjnmH2aDMhWD1O7wpS.iNDU3h6t2';
    const [res] = await db.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'student_emma']);
    console.log('UPDATED_ROWS', res.affectedRows);
    const [rows] = await db.query('SELECT username,password_hash,CHAR_LENGTH(password_hash) AS len FROM users WHERE username = ?', ['student_emma']);
    console.log(rows);
  } catch (e) {
    console.error('ERROR', e.message);
  } finally {
    process.exit(0);
  }
})();
