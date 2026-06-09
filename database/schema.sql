-- Student Management System database schema
-- Run these statements in your MySQL client to create the database structure and seeded sample data.

CREATE DATABASE IF NOT EXISTS student_management_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_management_system;

DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  subject_specialization VARCHAR(120),
  hire_date DATE,
  role ENUM('admin','teacher','parent','student') NOT NULL DEFAULT 'student',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(120) NOT NULL,
  section VARCHAR(30) NOT NULL,
  room_number VARCHAR(30),
  capacity INT DEFAULT 30,
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(30) NOT NULL UNIQUE,
  class_id INT NOT NULL,
  parent_id INT,
  gender ENUM('Male','Female','Other') DEFAULT 'Male',
  date_of_birth DATE,
  address TEXT,
  phone_number VARCHAR(20),
  email VARCHAR(100),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status ENUM('Active','Inactive','Graduated','Transferred') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present','Absent','Late','Excused') NOT NULL DEFAULT 'Present',
  marked_by_teacher_id INT,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_attendance_record (student_id, class_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by_teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_name VARCHAR(120) NOT NULL,
  quiz_mark DECIMAL(5,2) DEFAULT 0,
  assignment_mark DECIMAL(5,2) DEFAULT 0,
  exam_mark DECIMAL(5,2) DEFAULT 0,
  total_mark DECIMAL(6,2) GENERATED ALWAYS AS (quiz_mark + assignment_mark + exam_mark) STORED,
  max_marks DECIMAL(6,2) DEFAULT 100,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS ((quiz_mark + assignment_mark + exam_mark) / max_marks * 100) STORED,
  grade_letter VARCHAR(4) DEFAULT 'F',
  semester ENUM('1','2','Annual') NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_grade_record (student_id, subject_name, semester, academic_year),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (username, password_hash, role) VALUES
('admin', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'admin'),
('teacher_john', 'NgFaTcp6rG5YWMRdmHDCfu7.qSLhusKNqRBuU1UDIPLMfMhKkrxAO', 'teacher'),
('teacher_jane', 'wAHC9/ChKBH/nyhhQrVE/.Ze7frUEiT3Krh6eb291J6Yfx8vo9mB.', 'teacher'),
('student_emma', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'student'),
('student_liam', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'student'),
('student_olivia', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'student'),
('student_noah', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'student'),
('student_ava', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'student'),
('student_mia', 'uOgWlFwY1JJNB2M4hO5/t.GFVj8Y7d32fzGUCRA0hM3JJhsGk7ogy', 'student');

INSERT INTO classes (class_name, section, room_number, capacity, academic_year) VALUES
('Grade 9', 'A', '101', 35, '2025-2026'),
('Grade 9', 'B', '102', 35, '2025-2026'),
('Grade 10', 'A', '201', 35, '2025-2026');

INSERT INTO students (user_id, first_name, last_name, roll_number, class_id, gender, date_of_birth) VALUES
(4, 'Emma', 'Smith', 'STU2024001', 1, 'Female', '2008-04-12'),
(5, 'Liam', 'Johnson', 'STU2024002', 1, 'Male', '2008-09-18'),
(6, 'Olivia', 'Williams', 'STU2024003', 1, 'Female', '2008-12-06'),
(7, 'Noah', 'Brown', 'STU2024004', 2, 'Male', '2008-03-27'),
(8, 'Ava', 'Davis', 'STU2024005', 2, 'Female', '2008-11-08'),
(9, 'Mia', 'Martinez', 'STU2024006', 3, 'Female', '2007-08-22');

INSERT INTO grades (student_id, subject_name, quiz_mark, assignment_mark, exam_mark, max_marks, grade_letter, semester, academic_year, remarks) VALUES
(1, 'Mathematics', 18.5, 19.0, 57.0, 100.0, 'A+', '1', '2025-2026', 'Excellent performance'),
(1, 'English', 16.0, 18.0, 55.0, 100.0, 'A', '1', '2025-2026', 'Strong command of language'),
(2, 'Mathematics', 15.0, 16.0, 50.0, 100.0, 'A', '1', '2025-2026', 'Good progress'),
(3, 'Science', 14.0, 14.0, 45.0, 100.0, 'B+', '1', '2025-2026', 'Solid conceptual knowledge');
