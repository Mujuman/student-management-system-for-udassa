require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const username = 'admin';
    const password = 'Password123!';
    const [users] = await db.query('SELECT id, username, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1', [username]);
    console.log('DB_USERS', users);
    if (!users || users.length === 0) { console.log('NO_USER'); process.exit(0); }
    const user = users[0];
    console.log('USER_HASH_LEN', user.password_hash ? user.password_hash.length : 0);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('BCRYPT_COMPARE', isPasswordValid);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
    console.log('JWT_LEN', token.length);
  } catch (e) {
    console.error('ERROR', e.stack || e.message);
  } finally {
    process.exit(0);
  }
})();
