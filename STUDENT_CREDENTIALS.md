# Student Login Credentials

## Current Students in System

| Roll No.    | Name              | Username         | Class      | Password (Default) |
|-------------|-------------------|------------------|------------|--------------------|
| 12          | mmmmm ddsdsfs     | mmmmmddsdsfs     | Grade 10-A | Student123!        |
| 23          | Mujahid Hussen    | mujahidhussen    | Grade 10-A | Student123!        |
| STU2024001  | Emma Smith        | student_emma     | Grade 9-A  | Student123!        |
| STU2024002  | Liam Johnson      | student_liam     | Grade 9-A  | Student123!        |
| STU2024003  | Olivia Williams   | student_olivia   | Grade 9-A  | Student123!        |

## How to Login as a Student

1. Go to the login page
2. Enter the **Username** from the table above
3. Enter the password: `Student123!` (unless it was changed)
4. Click Login

## How to Find Student Usernames

### Method 1: View in Student Directory (Admin Only)
- Login as admin
- Go to "Students" page
- The username column now shows all student usernames

### Method 2: Run the Script
```bash
node backend/scripts/list_student_credentials.js
```

### Method 3: Check After Creating Student
- When you create a new student, the success message will show: "Student added successfully! Username: [username]"

## New Features Added

### 1. Username Display
- Student table now shows username column
- Usernames are visible to all users
- Bold formatting for easy identification

### 2. Edit Student (Admin Only)
- Click the edit (pencil) icon next to any student
- Update first name, last name, or roll number
- Changes are saved immediately

### 3. Delete Student (Admin Only)
- Click the delete (trash) icon next to any student
- Confirm the deletion
- Student and their user account are permanently removed

## Notes

- **Default Password**: All students created without a specific password get `Student123!`
- **Auto-Generated Usernames**: If you don't provide a username, the system creates one from first name + last name
- **Username Uniqueness**: The system ensures all usernames are unique
- **Admin Access**: Only admins can create, edit, or delete students
