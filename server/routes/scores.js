import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

const emitRefresh = (req, resource) => {
  const io = req.app.get('io');
  if (io) io.emit('data_refresh', { resource });
};

// Helper to extract grade from class name (e.g., "7A" -> 7, "12B" -> 12)
const getGradeFromClassName = (className) => {
  const match = className.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// 1. Get Grid Data (Students + Subjects + Scores + Remarks)
router.get('/grid', async (req, res) => {
  try {
    const { classId, examType } = req.query;

    if (!classId || !examType) {
      return res.status(400).json({ success: false, message: 'ClassID and ExamType are required' });
    }

    const connection = await pool.getConnection();

    try {
      // A. Get Class Info (to determine grade)
      const [classRows] = await connection.execute('SELECT ClassName FROM class WHERE ClassId = ?', [classId]);
      if (classRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }
      const className = classRows[0].ClassName;
      const gradeLevel = getGradeFromClassName(className);

      // B. Get Students
      const [students] = await connection.execute(
        `SELECT StudentID, StudentFirstname, StudentLastname, StudentSex 
         FROM student 
         WHERE ClassID = ? 
         ORDER BY StudentLastname, StudentFirstname`,
        [classId]
      );

      // C. Get Subjects (Filtered by Grade if possible, otherwise all)
      let subjects = [];
      if (gradeLevel) {
        const [subjRows] = await connection.execute(
          `SELECT s.SubjectID, s.SubjectName 
           FROM subject s
           JOIN grade_subject gs ON s.SubjectID = gs.SubjectId
           WHERE gs.GradeLevel = ?
           ORDER BY s.SubjectName`, // Ordering by name for now, or use a specific order col if exists
          [gradeLevel]
        );
        subjects = subjRows;
      }

      // Fallback: If no subjects found for grade (or no grade logic), return all subjects?
      // The prompt implies filtering. If empty, maybe the mapping is missing.
      // Let's stick to the prompt's logic: "LoadSubjectsForGrade".
      // If list is empty, user might want to see that.

      // D. Get Scores for these students & exam type
      // We can fetch all scores for this Class + ExamType by joining tables
      // But `student_score` only links StudentId.
      // So: SELECT * FROM student_score WHERE ExamType = ? AND StudentId IN (student_ids)
      let scores = [];
      let remarks = [];
      
      if (students.length > 0) {
        const studentIds = students.map(s => `'${s.StudentID}'`).join(',');
        
        // Fetch Scores
        const [scoreRows] = await connection.execute(
          `SELECT StudentId, SubjectId, Score 
           FROM student_score 
           WHERE ExamType = ? AND StudentId IN (${studentIds})`, // Safe because IDs are from DB
           [examType]
        );
        scores = scoreRows;

        // Fetch Remarks
        const [remarkRows] = await connection.execute(
          `SELECT StudentId, Remarks 
           FROM student_remarks 
           WHERE ExamType = ? AND StudentId IN (${studentIds})`,
           [examType]
        );
        remarks = remarkRows;
      }

      res.json({
        success: true,
        data: {
          students,
          subjects,
          scores, // Map { StudentId + SubjectId -> Score }
          remarks, // Map { StudentId -> Remark }
          meta: {
            className,
            gradeLevel
          }
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching grid data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Save Score
router.post('/score', async (req, res) => {
  try {
    const { studentId, subjectId, examType, score } = req.body;

    // Validation
    if (!studentId || !subjectId || !examType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    try {
      if (score === null || score === '' || score === undefined) {
        // DELETE if score is empty (as per prompt)
        await connection.execute(
          `DELETE FROM student_score 
           WHERE StudentId = ? AND SubjectId = ? AND ExamType = ?`,
          [studentId, subjectId, examType]
        );
      } else {
        // UPSERT
        // Check if `ScoreId` is auto-inc. If so, we don't include it in INSERT.
        // UNIQUE KEY likely on (StudentId, SubjectId, ExamType).
        // Wait, I need to confirm the unique key on student_score.
        // The prompt says "StudentId + SubjectId + ExamType - Composite unique key".
        // The `DESCRIBE` showed `ScoreId`.
        // I will assume there is a UNIQUE constraint. If not, this might duplicate.
        // Safe approach: Check exists, then update or insert. Or use ON DUPLICATE KEY UPDATE.
        
        const query = `
          INSERT INTO student_score (StudentId, SubjectId, Score, ExamType, ScoreDate, UpdatedDate)
          VALUES (?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
          Score = VALUES(Score), 
          UpdatedDate = NOW()
        `;
        
        await connection.execute(query, [studentId, subjectId, score, examType]);
      }

      res.json({ success: true, message: 'Score saved' });

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('ranking_update', { studentId, subjectId, examType });
      }
      emitRefresh(req, 'scores');

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Save Remark
router.post('/remark', async (req, res) => {
  try {
    const { studentId, examType, remarks } = req.body;

    if (!studentId || !examType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    try {
      if (!remarks || remarks.trim() === '') {
        // Delete if empty
        await connection.execute(
          `DELETE FROM student_remarks WHERE StudentId = ? AND ExamType = ?`,
          [studentId, examType]
        );
      } else {
        // Upsert
        const query = `
          INSERT INTO student_remarks (StudentId, ExamType, Remarks, RemarkDate)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE 
          Remarks = VALUES(Remarks), 
          RemarkDate = NOW()
        `;
        await connection.execute(query, [studentId, examType, remarks]);
      }
      
      res.json({ success: true, message: 'Remark saved' });
      emitRefresh(req, 'scores');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving remark:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
