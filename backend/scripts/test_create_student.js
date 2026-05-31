const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const testUrl = `http://localhost:${process.env.PORT || 5000}/api`;

async function testCreateStudent() {
  try {
    // First login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${testUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Password123!' })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✓ Login successful\n');

    // Test 1: Create student with custom username
    console.log('2. Creating student with custom username "john_doe_2024"...');
    const createResponse1 = await fetch(`${testUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: 'john_doe_2024',
        password: 'MyPassword123!',
        first_name: 'John',
        last_name: 'Doe',
        roll_number: 'JD2024',
        class_id: 1,
        gender: 'Male'
      })
    });

    const result1 = await createResponse1.json();
    if (createResponse1.ok) {
      console.log('✓ Student created successfully!');
      console.log(`  Username: ${result1.data.username}`);
      console.log(`  Password: MyPassword123!`);
      console.log(`  Roll Number: ${result1.data.roll_number}\n`);
    } else {
      console.log(`✗ Failed (${createResponse1.status}): ${result1.message || JSON.stringify(result1)}\n`);
    }

    // Test 2: Create student without username (auto-generate)
    console.log('3. Creating student without username (auto-generate)...');
    const createResponse2 = await fetch(`${testUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: 'Jane',
        last_name: 'Smith',
        roll_number: 'JS2024',
        class_id: 1,
        gender: 'Female'
      })
    });

    const result2 = await createResponse2.json();
    if (createResponse2.ok) {
      console.log('✓ Student created successfully!');
      console.log(`  Username: ${result2.data.username} (auto-generated)`);
      console.log(`  Password: Student123! (default)`);
      console.log(`  Roll Number: ${result2.data.roll_number}\n`);
    } else {
      console.log(`✗ Failed: ${result2.message}\n`);
    }

    // Test 3: Try to login as the newly created student with custom username
    console.log('4. Testing login with custom username student...');
    const studentLoginResponse = await fetch(`${testUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'john_doe_2024', password: 'MyPassword123!' })
    });

    if (studentLoginResponse.ok) {
      const studentData = await studentLoginResponse.json();
      console.log('✓ Student login successful!');
      console.log(`  Logged in as: ${studentData.data.user.username}`);
      console.log(`  Role: ${studentData.data.user.role}\n`);
    } else {
      const errorData = await studentLoginResponse.json();
      console.log(`✗ Student login failed (${studentLoginResponse.status}): ${errorData.message || JSON.stringify(errorData)}\n`);
    }

    console.log('=== Test Complete ===');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testCreateStudent();
