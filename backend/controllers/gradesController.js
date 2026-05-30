const db = require('../config/database');
const Logger = require('../utils/logger');

const calculateGradeLetter = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'F';
};

const parseMark = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : Number(parsed.toFixed(2));
};

const calculatePercentage = (totalMark, maxMarks) => {
  if (!maxMarks || maxMarks <= 0) return 0;
  return Number(((totalMark / maxMarks) * 100).toFixed(2));
};

const formatGradeRecord = (grade) => ({
  id: grade.id,
  student_id: grade.student_id,
  subject_name: grade.subject_name,
  quiz_mark: Number(grade.quiz_mark),
  assignment_mark: Number(grade.assignment_mark),
  exam_mark: Number(grade.exam_mark),
  total_mark: Number(grade.total_mark),
  max_marks: Number(grade.max_marks),
  percentage: Number(grade.percentage),
  grade_letter: grade.grade_letter,
  semester: grade.semester,
  academic_year: grade.academic_year,
  remarks: grade.remarks,
  created_at: grade.created_at,
  updated_at: grade.updated_at
});

const canReadStudentRecords = async (user, studentId) => {
  if (user.role !== 'student') return true;

  const [students] = await db.query(
    'SELECT id FROM students WHERE id = ? AND user_id = ? LIMIT 1',
    [studentId, user.id]
  );

  return students.length > 0;
};

const syncGrades = async (req, res) => {
  try {
    const { student_id, last_sync_time } = req.query;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id query parameter is required.'
      });
    }

    if (!(await canReadStudentRecords(req.user, student_id))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students can only view their own grades.'
      });
    }

    const syncTime = last_sync_time || '1970-01-01 00:00:00';

    const [grades] = await db.query(
      `SELECT
        g.id,
        g.student_id,
        g.subject_name,
        g.quiz_mark,
        g.assignment_mark,
        g.exam_mark,
        g.total_mark,
        g.max_marks,
        g.percentage,
        g.grade_letter,
        g.semester,
        g.academic_year,
        g.remarks,
        g.updated_at
      FROM grades g
      WHERE g.student_id = ?
        AND g.updated_at > ?
      ORDER BY g.updated_at DESC`,
      [student_id, syncTime]
    );

    Logger.info(`Grades sync for student ${student_id}: ${grades.length} records`);

    res.status(200).json({
      success: true,
      message: 'Grades synced successfully.',
      sync_time: new Date().toISOString(),
      data: grades.map(formatGradeRecord)
    });
  } catch (error) {
    Logger.error('Sync grades error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while syncing grades.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!(await canReadStudentRecords(req.user, studentId))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students can only view their own grades.'
      });
    }

    const [grades] = await db.query(
      `SELECT
        g.id,
        g.student_id,
        g.subject_name,
        g.quiz_mark,
        g.assignment_mark,
        g.exam_mark,
        g.total_mark,
        g.max_marks,
        g.percentage,
        g.grade_letter,
        g.semester,
        g.academic_year,
        g.remarks,
        g.updated_at
      FROM grades g
      WHERE g.student_id = ?
      ORDER BY g.academic_year DESC, g.semester DESC, g.subject_name ASC`,
      [studentId]
    );

    res.status(200).json({
      success: true,
      message: 'Student grades retrieved successfully.',
      data: grades.map(formatGradeRecord)
    });
  } catch (error) {
    Logger.error('Get student grades error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving grades.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getGradeById = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const [grades] = await db.query(
      `SELECT
        g.id,
        g.student_id,
        g.subject_name,
        g.quiz_mark,
        g.assignment_mark,
        g.exam_mark,
        g.total_mark,
        g.max_marks,
        g.percentage,
        g.grade_letter,
        g.semester,
        g.academic_year,
        g.remarks,
        g.created_at,
        g.updated_at
      FROM grades g
      WHERE g.id = ?
      LIMIT 1`,
      [gradeId]
    );

    if (grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade record not found.'
      });
    }

    if (!(await canReadStudentRecords(req.user, grades[0].student_id))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students can only view their own grades.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Grade record retrieved successfully.',
      data: formatGradeRecord(grades[0])
    });
  } catch (error) {
    Logger.error('Get grade by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the grade record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createGrade = async (req, res) => {
  try {
    const {
      student_id,
      subject_name,
      quiz_mark,
      assignment_mark,
      exam_mark,
      max_marks,
      semester,
      academic_year,
      remarks
    } = req.body;

    if (!student_id || !subject_name || !semester || !academic_year) {
      return res.status(400).json({
        success: false,
        message: 'student_id, subject_name, semester, and academic_year are required.'
      });
    }

    const quiz = parseMark(quiz_mark);
    const assignment = parseMark(assignment_mark);
    const exam = parseMark(exam_mark);
    const maxMarks = parseMark(max_marks, 100);
    const totalMark = Number((quiz + assignment + exam).toFixed(2));
    const percentage = calculatePercentage(totalMark, maxMarks);
    const gradeLetter = calculateGradeLetter(percentage);

    const [result] = await db.query(
      `INSERT INTO grades
        (student_id, subject_name, quiz_mark, assignment_mark, exam_mark, max_marks, grade_letter, semester, academic_year, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, subject_name, quiz, assignment, exam, maxMarks, gradeLetter, semester, academic_year, remarks || null]
    );

    res.status(201).json({
      success: true,
      message: 'Grade record created successfully.',
      data: {
        id: result.insertId,
        student_id,
        subject_name,
        quiz_mark: quiz,
        assignment_mark: assignment,
        exam_mark: exam,
        total_mark: totalMark,
        max_marks: maxMarks,
        percentage,
        grade_letter: gradeLetter,
        semester,
        academic_year,
        remarks: remarks || null
      }
    });
  } catch (error) {
    Logger.error('Create grade error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A grade record for this student, subject, semester, and academic year already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the grade record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const [grades] = await db.query('SELECT * FROM grades WHERE id = ? LIMIT 1', [gradeId]);

    if (grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade record not found.'
      });
    }

    const existing = grades[0];
    const student_id = req.body.student_id ?? existing.student_id;
    const subject_name = req.body.subject_name ?? existing.subject_name;
    const semester = req.body.semester ?? existing.semester;
    const academic_year = req.body.academic_year ?? existing.academic_year;
    const quiz = req.body.quiz_mark !== undefined ? parseMark(req.body.quiz_mark, Number(existing.quiz_mark)) : Number(existing.quiz_mark);
    const assignment = req.body.assignment_mark !== undefined ? parseMark(req.body.assignment_mark, Number(existing.assignment_mark)) : Number(existing.assignment_mark);
    const exam = req.body.exam_mark !== undefined ? parseMark(req.body.exam_mark, Number(existing.exam_mark)) : Number(existing.exam_mark);
    const maxMarks = req.body.max_marks !== undefined ? parseMark(req.body.max_marks, Number(existing.max_marks || 100)) : Number(existing.max_marks || 100);
    const remarks = req.body.remarks !== undefined ? req.body.remarks : existing.remarks;

    const totalMark = Number((quiz + assignment + exam).toFixed(2));
    const percentage = calculatePercentage(totalMark, maxMarks);
    const gradeLetter = calculateGradeLetter(percentage);

    await db.query(
      `UPDATE grades SET
        student_id = ?,
        subject_name = ?,
        quiz_mark = ?,
        assignment_mark = ?,
        exam_mark = ?,
        max_marks = ?,
        grade_letter = ?,
        semester = ?,
        academic_year = ?,
        remarks = ?
      WHERE id = ?`,
      [student_id, subject_name, quiz, assignment, exam, maxMarks, gradeLetter, semester, academic_year, remarks || null, gradeId]
    );

    res.status(200).json({
      success: true,
      message: 'Grade record updated successfully.',
      data: {
        id: Number(gradeId),
        student_id,
        subject_name,
        quiz_mark: quiz,
        assignment_mark: assignment,
        exam_mark: exam,
        total_mark: totalMark,
        max_marks: maxMarks,
        percentage,
        grade_letter: gradeLetter,
        semester,
        academic_year,
        remarks: remarks || null
      }
    });
  } catch (error) {
    Logger.error('Update grade error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Updating this grade would create a duplicate record.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the grade record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const [result] = await db.query('DELETE FROM grades WHERE id = ?', [gradeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade record not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Grade record deleted successfully.'
    });
  } catch (error) {
    Logger.error('Delete grade error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the grade record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  syncGrades,
  getStudentGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade
};
