const db = require('../config/database');

(async () => {
  try {
    const hash = '$2b$10$Enw2KqTYE7hx74ZkkO3qWOrElEXevvZz34eOKzevu1I0CJ2MmduHW';
    const [res] = await db.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'admin']);
    console.log('UPDATED_ROWS', res.affectedRows);
    const [rows] = await db.query('SELECT username, password_hash, CHAR_LENGTH(password_hash) AS len FROM users WHERE username = ?', ['admin']);
    console.log(rows);
  } catch (e) {
    console.error('ERROR', e.message);
  } finally {
    process.exit(0);
  }
})();
