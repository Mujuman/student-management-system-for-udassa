const db = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listStudentCredentials() {
  try {
    const [students] = await db.query(`
      SELECT 
        s.id,
        s.roll_number,
        s.first_name,
        s.last_name,
        u.username,
        c.class_name,
        c.section
      FROM students s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN classes c ON c.id = s.class_id
      ORDER BY c.class_name, s.roll_number
    `);

    console.log('\n=== Student Login Credentials ===\n');
    console.log('Default Password: Student123! (if not changed)\n');
    console.log('Roll No. | Name                    | Username            | Class');
    console.log('---------|-------------------------|---------------------|------------------');
    
    students.forEach(student => {
      const name = `${student.first_name} ${student.last_name}`;
      const classInfo = student.class_name ? `${student.class_name}-${student.section}` : 'Unassigned';
      console.log(
        `${student.roll_number.padEnd(8)} | ${name.padEnd(23)} | ${(student.username || 'N/A').padEnd(19)} | ${classInfo}`
      );
    });
    
    console.log(`\nTotal students: ${students.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listStudentCredentials();
