const db = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listUsernames() {
  try {
    const [users] = await db.query(
      'SELECT id, username, role FROM users ORDER BY role, username'
    );

    console.log('\n=== Existing Usernames ===\n');
    users.forEach(user => {
      console.log(`${user.id.toString().padStart(4)} | ${user.username.padEnd(20)} | ${user.role}`);
    });
    console.log(`\nTotal users: ${users.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listUsernames();
