import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { classId, examType, subjectId } = req.query;
        
        if (!classId || !examType) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        const connection = await pool.getConnection();
        
        try {
            // Get students
            const [students] = await connection.execute(
                'SELECT StudentID, StudentFirstname, StudentLastname, StudentSex FROM student WHERE ClassID = ?',
                [classId]
            );

            if (students.length === 0) {
                return res.json({ success: true, data: [] });
            }

            const studentIds = students.map(s => `'${s.StudentID}'`).join(',');
            
            // Get scores
            let query = `
                SELECT ss.StudentId, ss.SubjectId, ss.Score, s.SubjectName
                FROM student_score ss
                JOIN subject s ON ss.SubjectId = s.SubjectId
                WHERE ss.ExamType = ? AND ss.StudentId IN (${studentIds})
            `;
            const params = [examType];

            // If filtering by subject
            if (subjectId && subjectId !== '-1') {
                query += ' AND ss.SubjectId = ?';
                params.push(subjectId);
            }

            const [scores] = await connection.execute(query, params);
            
            // Calculate totals
            const studentMap = {};
            
            students.forEach(s => {
                studentMap[s.StudentID] = {
                    StudentID: s.StudentID,
                    Name: `${s.StudentLastname} ${s.StudentFirstname}`,
                    StudentSex: s.StudentSex,
                    Total: 0,
                    Average: 0,
                    ScoreCount: 0,
                    ...s
                    // We will add subject scores dynamically
                };
            });

            scores.forEach(row => {
                if (studentMap[row.StudentId]) {
                    studentMap[row.StudentId][row.SubjectName] = row.Score;
                    studentMap[row.StudentId].Total += parseFloat(row.Score); // Ensure number
                    studentMap[row.StudentId].ScoreCount++;
                }
            });

            // Calculate Average and finalize list
            const result = Object.values(studentMap).map(s => {
                // If subjectId is filtered, Average is just that score (or we might want average of selected subjects)
                // Assuming Average is across all selected/fetched scores
                s.Average = s.ScoreCount > 0 ? (s.Total / s.ScoreCount).toFixed(2) : 0;
                return s;
            });

            // Sort and Rank
            result.sort((a, b) => parseFloat(b.Total) - parseFloat(a.Total));
            
            // Assign Ranks (handle ties properly?)
            // Simple rank for now
            result.forEach((s, index) => {
                s.Rank = index + 1;
            });

            res.json({ success: true, data: result });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
