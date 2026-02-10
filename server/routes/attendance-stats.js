// attendance-stats.js - UPDATED
import express from 'express';
import pool from '../config/db.js';
import { verifyToken, checkRole } from '../middleware/auth.js'; // Add auth middleware

const router = express.Router();

// Get daily attendance statistics (Admin/Teacher access)
router.get('/attendance/stats/daily', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const connection = await pool.getConnection();
    
    // Role-based filtering
    let roleFilter = '';
    const params = [targetDate];
    
    if (req.user.role === 'teacher') {
      // Teachers can only see their own classes/subjects
      roleFilter = `
        AND EXISTS (
          SELECT 1 FROM teacher_classes tc 
          WHERE tc.ClassID = s.ClassID 
          AND tc.TeacherID = ?
        )
      `;
      params.push(req.user.userId);
    }
    
    const query = `
      SELECT 
        COUNT(DISTINCT s.ClassID) as total_classes,
        COUNT(DISTINCT a.SessionID) as total_sessions,
        COUNT(DISTINCT a.StudentID) as total_students,
        SUM(CASE WHEN st.StatusCode = 'P' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN st.StatusCode = 'A' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN st.StatusCode = 'L' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN st.StatusCode IN ('E', 'H', 'O') THEN 1 ELSE 0 END) as other_count
      FROM attendance a
      LEFT JOIN attendance_status st ON a.StatusID = st.StatusID
      LEFT JOIN attendance_sessions s ON a.SessionID = s.SessionID
      WHERE a.AttendanceDate = ? ${roleFilter}
    `;
    
    const [rows] = await connection.execute(query, params);
    connection.release();
    
    const stats = rows[0] || {};
    
    // Calculate percentages
    const total = stats.total_students || 0;
    const presentPercent = total > 0 ? Math.round((stats.present_count / total) * 100) : 0;
    const absentPercent = total > 0 ? Math.round((stats.absent_count / total) * 100) : 0;
    const latePercent = total > 0 ? Math.round((stats.late_count / total) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        ...stats,
        present_percent: presentPercent,
        absent_percent: absentPercent,
        late_percent: latePercent,
        date: targetDate
      }
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get monthly attendance overview (with role filtering)
router.get('/attendance/stats/monthly', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    const connection = await pool.getConnection();
    
    // Role-based filtering
    let roleFilter = '';
    const params = [targetYear, targetMonth];
    
    if (req.user.role === 'teacher') {
      roleFilter = `
        AND EXISTS (
          SELECT 1 FROM teacher_classes tc 
          WHERE tc.ClassID = a.ClassID 
          AND tc.TeacherID = ?
        )
      `;
      params.push(req.user.userId);
    }
    
    const query = `
      SELECT 
        DATE_FORMAT(a.AttendanceDate, '%Y-%m-%d') as date,
        COUNT(DISTINCT a.StudentID) as total_students,
        SUM(CASE WHEN st.StatusCode = 'P' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN st.StatusCode = 'A' THEN 1 ELSE 0 END) as absent_count,
        ROUND(
          (SUM(CASE WHEN st.StatusCode = 'P' THEN 1 ELSE 0 END) / COUNT(DISTINCT a.StudentID)) * 100, 
          2
        ) as attendance_rate
      FROM attendance a
      LEFT JOIN attendance_status st ON a.StatusID = st.StatusID
      WHERE YEAR(a.AttendanceDate) = ? AND MONTH(a.AttendanceDate) = ? ${roleFilter}
      GROUP BY DATE_FORMAT(a.AttendanceDate, '%Y-%m-%d')
      ORDER BY a.AttendanceDate
    `;
    
    const [rows] = await connection.execute(query, params);
    connection.release();
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// NEW: Print session report
router.get('/attendance/sessions/:id/print', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    // Get session details with subject info
    const sessionQuery = `
      SELECT 
        s.*, 
        c.ClassName, 
        c.ClassLetter,
        sub.SubjectName,
        sub.SubjectCode,
        CONCAT(t.FirstName, ' ', t.LastName) as TeacherName
      FROM attendance_sessions s
      LEFT JOIN class c ON s.ClassID = c.ClassId
      LEFT JOIN subject sub ON s.SubjectID = sub.SubjectID
      LEFT JOIN teacher t ON sub.TeacherID = t.TeacherID
      WHERE s.SessionID = ?
    `;
    
    const [sessionRows] = await connection.execute(sessionQuery, [id]);
    
    if (sessionRows.length === 0) {
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    const session = sessionRows[0];
    
    // Get attendance records for this session
    const attendanceQuery = `
      SELECT 
        a.*,
        st.StudentFirstname,
        st.StudentLastname,
        st.StudentID as StudentCode,
        ast.StatusName,
        ast.StatusCode,
        ast.Color
      FROM attendance a
      LEFT JOIN student st ON a.StudentID = st.StudentID
      LEFT JOIN attendance_status ast ON a.StatusID = ast.StatusID
      WHERE a.SessionID = ?
      ORDER BY st.StudentLastname, st.StudentFirstname
    `;
    
    const [attendanceRows] = await connection.execute(attendanceQuery, [id]);
    connection.release();
    
    // Calculate statistics
    const totalStudents = attendanceRows.length;
    const presentCount = attendanceRows.filter(row => row.StatusCode === 'P').length;
    const absentCount = attendanceRows.filter(row => row.StatusCode === 'A').length;
    const lateCount = attendanceRows.filter(row => row.StatusCode === 'L').length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    
    // Prepare data for PDF
    const reportData = {
      session: {
        ...session,
        formattedDate: new Date(session.SessionDate).toLocaleDateString('km-KH'),
        formattedStartTime: formatTimeForDisplay(session.StartTime),
        formattedEndTime: formatTimeForDisplay(session.EndTime)
      },
      attendance: attendanceRows.map((row, index) => ({
        no: index + 1,
        studentCode: row.StudentCode,
        studentName: `${row.StudentLastname} ${row.StudentFirstname}`,
        status: row.StatusName,
        notes: row.Notes || '-'
      })),
      statistics: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        generatedDate: new Date().toLocaleDateString('km-KH'),
        generatedTime: new Date().toLocaleTimeString('km-KH')
      }
    };
    
    res.json({ 
      success: true, 
      data: reportData,
      message: 'Report data ready for printing'
    });
  } catch (error) {
    console.error('Error generating print data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to format time
function formatTimeForDisplay(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

// NEW: Get sessions for printing (with filters)
router.get('/attendance/sessions/print/all', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, classId, subjectId, teacherId } = req.query;
    
    const connection = await pool.getConnection();
    
    let query = `
      SELECT 
        s.SessionID,
        s.SessionName,
        s.SessionDate,
        s.StartTime,
        s.EndTime,
        s.Status,
        s.CreatedAt,
        c.ClassName,
        c.ClassLetter,
        sub.SubjectName,
        sub.SubjectCode,
        CONCAT(t.FirstName, ' ', t.LastName) as TeacherName,
        COUNT(a.AttendanceID) as AttendanceCount,
        COUNT(CASE WHEN ast.StatusCode = 'P' THEN 1 END) as PresentCount
      FROM attendance_sessions s
      LEFT JOIN class c ON s.ClassID = c.ClassId
      LEFT JOIN subject sub ON s.SubjectID = sub.SubjectID
      LEFT JOIN teacher t ON sub.TeacherID = t.TeacherID
      LEFT JOIN attendance a ON s.SessionID = a.SessionID
      LEFT JOIN attendance_status ast ON a.StatusID = ast.StatusID
    `;
    
    const conditions = [];
    const params = [];
    
    // Date range filter
    if (startDate && endDate) {
      conditions.push('s.SessionDate BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    
    // Class filter
    if (classId) {
      conditions.push('s.ClassID = ?');
      params.push(classId);
    }
    
    // Subject filter
    if (subjectId) {
      conditions.push('s.SubjectID = ?');
      params.push(subjectId);
    }
    
    // Teacher filter (for admin viewing)
    if (teacherId && req.user.role === 'admin') {
      conditions.push('sub.TeacherID = ?');
      params.push(teacherId);
    }
    
    // Role-based filtering for non-admin users
    if (req.user.role === 'teacher') {
      conditions.push('sub.TeacherID = ?');
      params.push(req.user.userId);
    } else if (req.user.role === 'classrep') {
      // Class reps can only see their own class
      conditions.push('s.ClassID = ?');
      params.push(req.user.classId); // Assuming classId is stored in token
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY s.SessionID, s.SessionName, s.SessionDate, s.StartTime, s.EndTime, 
               s.Status, s.CreatedAt, c.ClassName, c.ClassLetter, 
               sub.SubjectName, sub.SubjectCode, t.FirstName, t.LastName
      ORDER BY s.SessionDate DESC, s.StartTime
    `;
    
    const [rows] = await connection.execute(query, params);
    connection.release();
    
    // Calculate statistics for each session
    const sessionsWithStats = rows.map(session => ({
      ...session,
      attendanceRate: session.AttendanceCount > 0 
        ? Math.round((session.PresentCount / session.AttendanceCount) * 100) 
        : 0,
      formattedDate: new Date(session.SessionDate).toLocaleDateString('km-KH'),
      formattedTime: `${formatTimeForDisplay(session.StartTime)} - ${formatTimeForDisplay(session.EndTime)}`
    }));
    
    res.json({ 
      success: true, 
      data: sessionsWithStats,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching sessions for print:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;