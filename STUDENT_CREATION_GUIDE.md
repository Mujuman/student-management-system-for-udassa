# Student Creation & Login Guide

## ✅ What Was Fixed

### 1. Username Field Now Accepts Custom Usernames
- **Before**: Username validation rejected underscores and special characters
- **After**: Usernames can contain letters, numbers, and underscores (e.g., `john_doe_2024`)

### 2. Username Display
- Student table now shows the username column
- Success message displays the username after creation
- Usernames are visible to all users for easy reference

### 3. Edit & Delete Features (Admin Only)
- Edit button to update student information
- Delete button to remove students
- Confirmation dialogs for safety

### 4. Improved Form UI
- Clear labels explaining username is optional
- Hints showing default password
- Better field descriptions

## 📝 How to Add a Student

### Option 1: With Custom Username (Recommended)
1. Login as **admin** (username: `admin`, password: `Password123!`)
2. Go to **Students** page
3. Fill in the form:
   - **Username**: Enter a custom username (e.g., `john_doe`, `student_2024`)
   - **Password**: Enter a password (or leave empty for default: `Student123!`)
   - **First Name**: Student's first name
   - **Last Name**: Student's last name
   - **Roll Number**: Unique roll number
   - **Class**: Select from dropdown
   - Other fields are optional
4. Click **Add Student**
5. **Important**: Note the username shown in the success message!

### Option 2: Auto-Generate Username
1. Leave the **Username** field empty
2. Fill in other required fields
3. System will auto-generate username from first name + last name
4. Example: "John Doe" → username: `johndoe`

## 🔑 Student Login

After creating a student, they can login with:
- **Username**: The username you provided (or auto-generated)
- **Password**: The password you set (or default: `Student123!`)

### Example:
```
Username: john_doe_2024
Password: MyPassword123!
```

## 🛠️ Important: Restart the Server

**After making the code changes, you MUST restart the backend server:**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

## 📋 Username Rules

✅ **Allowed**:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Underscores (_)

❌ **Not Allowed**:
- Spaces
- Special characters (@, #, $, %, etc.)
- Hyphens (-)

### Valid Examples:
- `john_doe`
- `student_2024`
- `emma_smith_01`
- `johndoe`

### Invalid Examples:
- `john-doe` (hyphen not allowed)
- `john doe` (space not allowed)
- `john@doe` (@ not allowed)

## 🔍 How to Find Student Usernames

### Method 1: Student Table (All Users)
- Go to Students page
- Username column shows all student usernames

### Method 2: Run Script
```bash
node backend/scripts/list_student_credentials.js
```

### Method 3: After Creation
- Success message shows: "Student added successfully! Username: [username]"

## 🎯 Testing

Run the test script to verify everything works:
```bash
node backend/scripts/test_create_student.js
```

This will:
1. Create a student with custom username
2. Create a student with auto-generated username
3. Test login with the created student

## 📊 Current Students

| Username | Password | Role |
|----------|----------|------|
| admin | Password123! | Admin |
| teacher_john | (unknown) | Teacher |
| student_emma | Student123! | Student |
| student_liam | Student123! | Student |
| student_olivia | Student123! | Student |

## ⚠️ Troubleshooting

### "Username already exists"
- Try a different username
- Or leave username empty to auto-generate

### "Roll number already exists"
- Each student needs a unique roll number
- Check existing students first

### Student can't login
- Verify the username is correct (check student table)
- Verify the password (default is `Student123!`)
- Check if the student account is active

### Changes not working
- **Restart the backend server** (this is the most common issue!)
- Clear browser cache
- Check browser console for errors
