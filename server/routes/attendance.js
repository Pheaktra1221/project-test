// attendance.js - UPDATED with authentication and fixes
import express from 'express';
import pool from '../config/db.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use('/attendance', verifyToken);

// Helper: Check teacher permissions
const checkTeacherPermission = async (teacherId, classId, subjectId = null) => {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT 1 FROM teacher_classes 
      WHERE TeacherID = ? AND ClassID = ?
    `;
    const params = [teacherId, classId];
    
    if (subjectId) {
      query += ' AND SubjectID = ?';
      params.push(subjectId);
    }
    
    const [rows] = await connection.execute(query, params);
    return rows.length > 0;
  } finally {
    connection.release();
  }
};

// Helper: Get user ID based on role
const getUserIdForRole = (user) => {
  if (user.role === 'admin') {
    return user.id;
  } else if (user.role === 'teacher' && user.teacherId) {
    return user.teacherId;
  } else if ((user.role === 'classrep' || user.role === 'student') && user.studentId) {
    return user.studentId;
  }
  return null;
};

// 1. Get attendance statuses
router.get('/attendance/statuses', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM attendance_status WHERE IsActive = 1');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching attendance statuses:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 2. Create session
router.post('/attendance/sessions', checkRole(['admin', 'teacher', 'classrep']), async (req, res) => {
  let connection;
  try {
    const { SessionName, SessionDate, ClassID, SubjectID, StartTime, EndTime, Status = 'open' } = req.body;
    
    if (!SessionName || !SessionDate || !ClassID) {
      return res.status(400).json({ 
        success: false, 
        message: 'SessionName, SessionDate, and ClassID are required' 
      });
    }

    const user = req.user;
    const userId = getUserIdForRole(user);
    
    if (!userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User ID not found for this role' 
      });
    }

    // Role-based validation
    if (user.role === 'teacher') {
      const hasPermission = await checkTeacherPermission(userId, ClassID, SubjectID);
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not assigned to teach this class/subject' 
        });
      }
    } else if (user.role === 'classrep') {
      if (user.classId !== parseInt(ClassID)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only create sessions for your own class' 
        });
      }
      if (Status === 'closed') {
        return res.status(403).json({ 
          success: false, 
          message: 'Class representatives cannot create closed sessions' 
        });
      }
    }

    connection = await pool.getConnection();
    
    // Check for overlapping sessions
    // Using strict inequality for overlap: (StartA < EndB) and (EndA > StartB)
    const checkQuery = `
      SELECT SessionID FROM attendance_sessions 
      WHERE ClassID = ? AND SessionDate = ? AND (
        StartTime < ? AND EndTime > ?
      )
    `;
    
    const [existing] = await connection.execute(checkQuery, [
      ClassID, SessionDate, 
      EndTime,    // Existing.Start < New.End
      StartTime   // Existing.End > New.Start
    ]);
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Session already exists for this time slot' 
      });
    }

    // Insert session with creator info
    const query = `
      INSERT INTO attendance_sessions 
      (SessionName, SessionDate, ClassID, SubjectID, StartTime, EndTime, Status, CreatedBy, CreatorRole) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      SessionName, SessionDate, ClassID, SubjectID, StartTime, EndTime, Status, userId, user.role
    ]);
    
    res.json({ 
      success: true, 
      message: 'Session created successfully',
      sessionId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 3. Get sessions with role-based filtering
router.get('/attendance/sessions', async (req, res) => {
  let connection;
  try {
    const { date, classId, subjectId } = req.query;
    const user = req.user;

    connection = await pool.getConnection();

    let query = `
      SELECT 
        s.*, 
        c.ClassName, 
        c.ClassLetter, 
        sub.SubjectName, 
        sub.subjectletter,
        CASE 
          WHEN s.CreatorRole = 'teacher' THEN 
            CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName)
          WHEN s.CreatorRole = 'classrep' THEN 
            CONCAT(st.StudentFirstname, ' ', st.StudentLastname)
          WHEN s.CreatorRole = 'admin' THEN 'Administrator'
          ELSE 'System'
        END as CreatorName
      FROM attendance_sessions s
      LEFT JOIN class c ON s.ClassID = c.ClassId
      LEFT JOIN subject sub ON s.SubjectID = sub.SubjectID
      LEFT JOIN teacher t ON s.CreatorRole = 'teacher' AND s.CreatedBy = t.TeacherID
      LEFT JOIN student st ON s.CreatorRole = 'classrep' AND s.CreatedBy = st.StudentID
    `;

    const conditions = [];
    const params = [];

    if (date) {
      conditions.push('s.SessionDate = ?');
      params.push(date);
    }

    if (classId) {
      conditions.push('s.ClassID = ?');
      params.push(classId);
    }

    if (subjectId) {
      conditions.push('s.SubjectID = ?');
      params.push(subjectId);
    }

    if (user.role === 'teacher' && user.teacherId) {
      conditions.push(`
        (s.SubjectID IN (
          SELECT Subject1 FROM teacher WHERE TeacherID = ?
          UNION
          SELECT Subject2 FROM teacher WHERE TeacherID = ?
        ) OR s.ClassID IN (
          SELECT ClassID FROM teacher_classes WHERE TeacherID = ?
        ))
      `);
      params.push(user.teacherId, user.teacherId, user.teacherId);
    } else if (user.role === 'classrep' && user.classId) {
      conditions.push('s.ClassID = ?');
      params.push(user.classId);
    } else if (user.role === 'student' && user.classId) {
      conditions.push('s.ClassID = ?');
      params.push(user.classId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.SessionDate DESC, s.StartTime, s.ClassID';

    const [rows] = await connection.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 4. Get session by ID
router.get('/attendance/sessions/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const user = req.user;
    
    connection = await pool.getConnection();
    
    let query = `
      SELECT 
        s.*, 
        c.ClassName, 
        c.ClassLetter, 
        sub.SubjectName, 
        sub.subjectletter,
        CASE 
          WHEN s.CreatorRole = 'teacher' THEN 
            CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName)
          WHEN s.CreatorRole = 'classrep' THEN 
            CONCAT(st.StudentFirstname, ' ', st.StudentLastname)
          WHEN s.CreatorRole = 'admin' THEN 'Administrator'
          ELSE 'System'
        END as CreatorName
      FROM attendance_sessions s
      LEFT JOIN class c ON s.ClassID = c.ClassId
      LEFT JOIN subject sub ON s.SubjectID = sub.SubjectID
      LEFT JOIN teacher t ON s.CreatorRole = 'teacher' AND s.CreatedBy = t.TeacherID
      LEFT JOIN student st ON s.CreatorRole = 'classrep' AND s.CreatedBy = st.StudentID
      WHERE s.SessionID = ?
    `;
    
    const params = [id];
    
    if (user.role === 'teacher' && user.teacherId) {
      query += ` AND (
        s.SubjectID IN (
          SELECT Subject1 FROM teacher WHERE TeacherID = ?
          UNION
          SELECT Subject2 FROM teacher WHERE TeacherID = ?
        ) OR s.ClassID IN (
          SELECT ClassID FROM teacher_classes WHERE TeacherID = ?
        )
      )`;
      params.push(user.teacherId, user.teacherId, user.teacherId);
    } else if ((user.role === 'classrep' || user.role === 'student') && user.classId) {
      query += ' AND s.ClassID = ?';
      params.push(user.classId);
    }
    
    const [rows] = await connection.execute(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found or you do not have permission' 
      });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 5. Update session
router.put('/attendance/sessions/:id', checkRole(['admin', 'teacher', 'classrep']), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = req.user;
    const userId = getUserIdForRole(user);
    
    if (!userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User ID not found for this role' 
      });
    }
    
    connection = await pool.getConnection();
    
    const [sessionRows] = await connection.execute(
      `SELECT s.* FROM attendance_sessions s WHERE s.SessionID = ?`,
      [id]
    );
    
    if (sessionRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    const session = sessionRows[0];
    let hasPermission = false;
    
    if (user.role === 'admin') {
      hasPermission = true;
    } else if (user.role === 'teacher') {
      const hasClassPermission = await checkTeacherPermission(userId, session.ClassID, session.SubjectID);
      const isCreator = session.CreatedBy == userId && session.CreatorRole === 'teacher';
      hasPermission = hasClassPermission || isCreator;
    } else if (user.role === 'classrep') {
      const isCreator = session.CreatedBy == userId && session.CreatorRole === 'classrep';
      const isSameClass = user.classId === session.ClassID;
      hasPermission = isCreator && isSameClass && session.Status === 'open';
      if (updates.Status === 'closed') {
        delete updates.Status;
      }
    }
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this session' 
      });
    }
    
    const fields = Object.keys(updates)
      .filter(key => key !== 'SessionID')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [
      ...Object.values(updates).filter((_, i) => Object.keys(updates)[i] !== 'SessionID'),
      id
    ];
    
    const updateQuery = `UPDATE attendance_sessions SET ${fields}, UpdatedAt = NOW() WHERE SessionID = ?`;
    
    const [result] = await connection.execute(updateQuery, values);
    
    res.json({ 
      success: true, 
      message: 'Session updated successfully',
      affectedRows: result.affectedRows 
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 6. Update session status
router.put('/attendance/sessions/:id/status', checkRole(['admin', 'teacher', 'classrep']), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    const userId = getUserIdForRole(user);
    
    if (!['open', 'closed', 'pending'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }
    
    if (!userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User ID not found for this role' 
      });
    }
    
    connection = await pool.getConnection();
    
    const [sessionRows] = await connection.execute(
      `SELECT s.* FROM attendance_sessions s WHERE s.SessionID = ?`,
      [id]
    );
    
    if (sessionRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    const session = sessionRows[0];
    let hasPermission = false;
    
    if (user.role === 'admin') {
      hasPermission = true;
    } else if (user.role === 'teacher') {
      const isCreator = session.CreatedBy == userId && session.CreatorRole === 'teacher';
      const hasClassPermission = await checkTeacherPermission(userId, session.ClassID, session.SubjectID);
      hasPermission = isCreator || hasClassPermission;
      
      if (session.Status === 'closed' && status === 'open') {
        hasPermission = false;
      }
    } else if (user.role === 'classrep') {
      hasPermission = false;
    }
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this session status' 
      });
    }
    
    const query = 'UPDATE attendance_sessions SET Status = ?, UpdatedAt = NOW() WHERE SessionID = ?';
    const [result] = await connection.execute(query, [status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Session status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 7. Get attendance for session
router.get('/attendance/session/:sessionId', async (req, res) => {
  let connection;
  try {
    const { sessionId } = req.params;
    const user = req.user;
    
    connection = await pool.getConnection();
    
    const [sessionRows] = await connection.execute(
      `SELECT s.* FROM attendance_sessions s WHERE s.SessionID = ?`,
      [sessionId]
    );
    
    if (sessionRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    const session = sessionRows[0];
    let hasPermission = false;
    
    if (user.role === 'admin') {
      hasPermission = true;
    } else if (user.role === 'teacher' && user.teacherId) {
      const hasClassPermission = await checkTeacherPermission(user.teacherId, session.ClassID, session.SubjectID);
      const isCreator = session.CreatedBy == user.teacherId && session.CreatorRole === 'teacher';
      hasPermission = hasClassPermission || isCreator;
    } else if ((user.role === 'classrep' || user.role === 'student') && user.classId) {
      hasPermission = user.classId === session.ClassID;
    }
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this session' 
      });
    }
    
    const query = `
      SELECT a.*, s.StatusName, s.StatusCode, s.Color
      FROM attendance a
      LEFT JOIN attendance_status s ON a.StatusID = s.StatusID
      WHERE a.SessionID = ?
      ORDER BY a.StudentID
    `;
    
    const [rows] = await connection.execute(query, [sessionId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 8. Save batch attendance
router.post('/attendance/session/:sessionId/batch', checkRole(['admin', 'teacher', 'classrep']), async (req, res) => {
  let connection;
  try {
    const { sessionId } = req.params;
    const { records } = req.body;
    const user = req.user;
    const userId = getUserIdForRole(user);
    
    if (!Array.isArray(records)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Records must be an array' 
      });
    }
    
    if (!userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User ID not found for this role' 
      });
    }
    
    connection = await pool.getConnection();
    
    const [sessionRows] = await connection.execute(
      `SELECT s.* FROM attendance_sessions s WHERE s.SessionID = ?`,
      [sessionId]
    );
    
    if (sessionRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    const session = sessionRows[0];
    let hasPermission = false;
    
    if (user.role === 'admin') {
      hasPermission = true;
    } else if (user.role === 'teacher') {
      const hasClassPermission = await checkTeacherPermission(userId, session.ClassID, session.SubjectID);
      const isCreator = session.CreatedBy == userId && session.CreatorRole === 'teacher';
      hasPermission = (hasClassPermission || isCreator) && session.Status === 'open';
    } else if (user.role === 'classrep') {
      const isCreator = session.CreatedBy == userId && session.CreatorRole === 'classrep';
      const isSameClass = user.classId === session.ClassID;
      hasPermission = isCreator && isSameClass && session.Status === 'open';
    }
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update attendance for this session' 
      });
    }
    
    await connection.beginTransaction();
    
    await connection.execute(
      'DELETE FROM attendance WHERE SessionID = ?',
      [sessionId]
    );
    
    for (const record of records) {
      const { StudentID, StatusID, Notes = '' } = record;
      
      await connection.execute(
        `INSERT INTO attendance 
         (StudentID, ClassID, SessionID, AttendanceDate, StatusID, Notes, RecordedBy, RecorderRole) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          StudentID,
          record.ClassID || session.ClassID,
          sessionId,
          record.AttendanceDate || session.SessionDate,
          StatusID,
          Notes,
          userId,
          user.role
        ]
      );
    }
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Attendance saved successfully',
      count: records.length 
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    console.error('Error saving attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 9. Get student attendance summary
router.get('/attendance/student/:studentId/summary', async (req, res) => {
  let connection;
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const user = req.user;
    
    connection = await pool.getConnection();
    
    if (user.role === 'teacher' && user.teacherId) {
      const [studentClass] = await connection.execute(
        'SELECT ClassID FROM student WHERE StudentID = ?',
        [studentId]
      );
      
      if (studentClass.length === 0) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      const hasPermission = await checkTeacherPermission(user.teacherId, studentClass[0].ClassID);
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this student\'s attendance' 
        });
      }
    } else if ((user.role === 'classrep' || user.role === 'student') && user.studentId) {
      if (parseInt(studentId) !== user.studentId && studentId !== user.studentId) { // loose check for string/int match
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view your own attendance' 
        });
      }
    }
    
    let query = `
      SELECT 
        DATE_FORMAT(a.AttendanceDate, '%Y-%m') as MonthYear,
        COUNT(*) as TotalDays,
        SUM(CASE WHEN s.StatusCode = 'P' THEN 1 ELSE 0 END) as PresentDays,
        SUM(CASE WHEN s.StatusCode = 'A' THEN 1 ELSE 0 END) as AbsentDays,
        SUM(CASE WHEN s.StatusCode = 'L' THEN 1 ELSE 0 END) as LateDays,
        SUM(CASE WHEN s.StatusCode = 'E' THEN 1 ELSE 0 END) as ExcusedDays
      FROM attendance a
      LEFT JOIN attendance_status s ON a.StatusID = s.StatusID
      WHERE a.StudentID = ?
    `;
    
    const params = [studentId];
    
    if (month && year) {
      query += ' AND YEAR(a.AttendanceDate) = ? AND MONTH(a.AttendanceDate) = ?';
      params.push(year, month);
    }
    
    query += ' GROUP BY DATE_FORMAT(a.AttendanceDate, "%Y-%m") ORDER BY MonthYear DESC';
    
    const [rows] = await connection.execute(query, params);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 10. Get class attendance report
router.get('/attendance/class/:classId/report', async (req, res) => {
  let connection;
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    const user = req.user;
    
    connection = await pool.getConnection();
    
    if (user.role === 'teacher' && user.teacherId) {
      const hasPermission = await checkTeacherPermission(user.teacherId, classId);
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this class report' 
        });
      }
    } else if ((user.role === 'classrep' || user.role === 'student') && user.classId) {
      if (parseInt(classId) !== user.classId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view your own class report' 
        });
      }
    }
    
    let query = `
      SELECT 
        s.StudentID,
        CONCAT(s.StudentFirstname, ' ', s.StudentLastname) as StudentName,
        COUNT(a.AttendanceID) as TotalDays,
        SUM(CASE WHEN st.StatusCode = 'P' THEN 1 ELSE 0 END) as PresentDays,
        SUM(CASE WHEN st.StatusCode = 'A' THEN 1 ELSE 0 END) as AbsentDays,
        SUM(CASE WHEN st.StatusCode = 'L' THEN 1 ELSE 0 END) as LateDays,
        SUM(CASE WHEN st.StatusCode = 'E' THEN 1 ELSE 0 END) as ExcusedDays,
        SUM(CASE WHEN st.StatusCode = 'H' THEN 1 ELSE 0 END) as HalfDays,
        SUM(CASE WHEN st.StatusCode = 'O' THEN 1 ELSE 0 END) as OtherDays
      FROM student s
      LEFT JOIN attendance a ON s.StudentID = a.StudentID AND s.ClassID = a.ClassID
      LEFT JOIN attendance_status st ON a.StatusID = st.StatusID
      WHERE s.ClassID = ?
    `;
    
    const params = [classId];
    
    if (startDate && endDate) {
      query += ' AND a.AttendanceDate BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' GROUP BY s.StudentID ORDER BY s.StudentLastname, s.StudentFirstname';
    
    const [rows] = await connection.execute(query, params);
    
    const data = rows.map(row => ({
      ...row,
      AttendanceRate: row.TotalDays > 0 
        ? Math.round((row.PresentDays / row.TotalDays) * 100) 
        : 0
    }));
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error generating class report:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 11. Delete session
router.delete('/attendance/sessions/:id', checkRole(['admin']), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    await connection.execute(
      'DELETE FROM attendance WHERE SessionID = ?',
      [id]
    );
    
    const [result] = await connection.execute(
      'DELETE FROM attendance_sessions WHERE SessionID = ?',
      [id]
    );
    
    await connection.commit();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 12. Print session report
router.get('/attendance/sessions/:id/print', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const user = req.user;
    
    connection = await pool.getConnection();
    
    let query = `
      SELECT 
        s.*, 
        c.ClassName, 
        c.ClassLetter,
        sub.SubjectName,
        sub.subjectletter,
        CASE 
          WHEN s.CreatorRole = 'teacher' THEN 
            CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName)
          WHEN s.CreatorRole = 'classrep' THEN 
            CONCAT(st.StudentFirstname, ' ', st.StudentLastname)
          ELSE 'System'
        END as CreatorName
      FROM attendance_sessions s
      LEFT JOIN class c ON s.ClassID = c.ClassId
      LEFT JOIN subject sub ON s.SubjectID = sub.SubjectId
      LEFT JOIN teacher t ON s.CreatorRole = 'teacher' AND s.CreatedBy = t.TeacherID
      LEFT JOIN student st ON s.CreatorRole = 'classrep' AND s.CreatedBy = st.StudentID
      WHERE s.SessionID = ?
    `;
    
    const params = [id];
    
    if (user.role === 'teacher' && user.teacherId) {
      query += ` AND (
        s.SubjectID IN (
          SELECT Subject1 FROM teacher WHERE TeacherID = ?
          UNION
          SELECT Subject2 FROM teacher WHERE TeacherID = ?
        ) OR s.ClassID IN (
          SELECT ClassID FROM teacher_classes WHERE TeacherID = ?
        )
      )`;
      params.push(user.teacherId, user.teacherId, user.teacherId);
    } else if ((user.role === 'classrep' || user.role === 'student') && user.classId) {
      query += ' AND s.ClassID = ?';
      params.push(user.classId);
    }
    
    const [sessionRows] = await connection.execute(query, params);
    
    if (sessionRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found or no permission' 
      });
    }
    
    const session = sessionRows[0];
    
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
    
    const totalStudents = attendanceRows.length;
    const presentCount = attendanceRows.filter(row => row.StatusCode === 'P').length;
    const absentCount = attendanceRows.filter(row => row.StatusCode === 'A').length;
    const lateCount = attendanceRows.filter(row => row.StatusCode === 'L').length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    
    const formatTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('km-KH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    const reportData = {
      session: {
        ...session,
        formattedDate: formatDate(session.SessionDate),
        formattedStartTime: formatTime(session.StartTime),
        formattedEndTime: formatTime(session.EndTime)
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
  } finally {
    if (connection) connection.release();
  }
});

// 13. Get teacher's classes and subjects
router.get('/teacher/:teacherId/classes', async (req, res) => {
  let connection;
  try {
    const { teacherId } = req.params;
    
    connection = await pool.getConnection();
    
    const [classes] = await connection.execute(
      `SELECT c.ClassId, c.ClassName, c.ClassLetter, tc.SubjectID 
       FROM teacher_classes tc
       JOIN class c ON tc.ClassID = c.ClassId
       WHERE tc.TeacherID = ?
       ORDER BY c.ClassName, c.ClassLetter`,
      [teacherId]
    );
    
    const [subjects] = await connection.execute(
      `SELECT s.SubjectId, s.SubjectName, s.subjectletter 
       FROM subject s
       WHERE s.SubjectId IN (
         SELECT Subject1 FROM teacher WHERE TeacherID = ?
         UNION
         SELECT Subject2 FROM teacher WHERE TeacherID = ?
       ) OR s.SubjectId IN (
         SELECT SubjectID FROM teacher_classes WHERE TeacherID = ?
       )
       ORDER BY s.SubjectName`,
      [teacherId, teacherId, teacherId]
    );
    
    res.json({ 
      success: true, 
      data: {
        classes,
        subjects
      }
    });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 14. Get all sessions for print with filters
router.get('/attendance/sessions/print/all', checkRole(['admin']), async (req, res) => {
  let connection;
  try {
    const { startDate, endDate, classId, subjectId } = req.query;
    
    connection = await pool.getConnection();
    
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
        sub.subjectletter,
        CASE 
          WHEN s.CreatorRole = 'teacher' THEN 
            CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName)
          WHEN s.CreatorRole = 'classrep' THEN 
            CONCAT(st.StudentFirstname, ' ', st.StudentLastname)
          ELSE 'System'
        END as CreatorName,
        COUNT(a.AttendanceID) as AttendanceCount,
        COUNT(CASE WHEN ast.StatusCode = 'P' THEN 1 END) as PresentCount
      FROM attendance_sessions s
      LEFT JOIN class c ON s.ClassID = c.ClassId
      LEFT JOIN subject sub ON s.SubjectID = sub.SubjectId
      LEFT JOIN teacher t ON s.CreatorRole = 'teacher' AND s.CreatedBy = t.TeacherID
      LEFT JOIN student st ON s.CreatorRole = 'classrep' AND s.CreatedBy = st.StudentID
      LEFT JOIN attendance a ON s.SessionID = a.SessionID
      LEFT JOIN attendance_status ast ON a.StatusID = ast.StatusID
    `;
    
    const conditions = [];
    const params = [];
    
    if (startDate && endDate) {
      conditions.push('s.SessionDate BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    
    if (classId) {
      conditions.push('s.ClassID = ?');
      params.push(classId);
    }
    
    if (subjectId) {
      conditions.push('s.SubjectID = ?');
      params.push(subjectId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY s.SessionID, s.SessionName, s.SessionDate, s.StartTime, s.EndTime, 
               s.Status, s.CreatedAt, c.ClassName, c.ClassLetter, 
               sub.SubjectName, sub.subjectletter, t.TeacherFirstName, t.TeacherLastName,
               st.StudentFirstname, st.StudentLastname
      ORDER BY s.SessionDate DESC, s.StartTime
    `;
    
    const [rows] = await connection.execute(query, params);
    
    const formatTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    };
    
    const sessionsWithStats = rows.map(session => ({
      ...session,
      attendanceRate: session.AttendanceCount > 0 
        ? Math.round((session.PresentCount / session.AttendanceCount) * 100) 
        : 0,
      formattedDate: new Date(session.SessionDate).toLocaleDateString('km-KH'),
      formattedTime: `${formatTime(session.StartTime)} - ${formatTime(session.EndTime)}`
    }));
    
    res.json({ 
      success: true, 
      data: sessionsWithStats,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching sessions for print:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 15. Get user's accessible classes and subjects
router.get('/attendance/user-resources', async (req, res) => {
  let connection;
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    connection = await pool.getConnection();
    
    let classes = [];
    let subjects = [];
    
    if (user.role === 'admin') {
      [classes] = await connection.execute(
        'SELECT ClassId, ClassName, ClassLetter FROM class ORDER BY ClassName, ClassLetter'
      );
      
      [subjects] = await connection.execute(
        'SELECT SubjectId, SubjectName, subjectletter FROM subject ORDER BY SubjectName'
      );
    } else if (user.role === 'teacher' && user.teacherId) {
      [classes] = await connection.execute(
        `SELECT DISTINCT c.ClassId, c.ClassName, c.ClassLetter 
         FROM teacher_classes tc
         JOIN class c ON tc.ClassID = c.ClassId
         WHERE tc.TeacherID = ?
         ORDER BY c.ClassName, c.ClassLetter`,
        [user.teacherId]
      );
      
      [subjects] = await connection.execute(
        `SELECT DISTINCT s.SubjectId, s.SubjectName, s.subjectletter 
         FROM subject s
         WHERE s.SubjectId IN (
           SELECT Subject1 FROM teacher WHERE TeacherID = ?
           UNION
           SELECT Subject2 FROM teacher WHERE TeacherID = ?
         ) OR s.SubjectId IN (
           SELECT SubjectID FROM teacher_classes WHERE TeacherID = ?
         )
         ORDER BY s.SubjectName`,
        [user.teacherId, user.teacherId, user.teacherId]
      );
    } else if ((user.role === 'classrep' || user.role === 'student') && user.classId) {
      [classes] = await connection.execute(
        'SELECT ClassId, ClassName, ClassLetter FROM class WHERE ClassId = ?',
        [user.classId]
      );
      
      [subjects] = await connection.execute(
        'SELECT SubjectId, SubjectName, subjectletter FROM subject ORDER BY SubjectName'
      );
    }
    
    res.json({ 
      success: true, 
      data: {
        classes,
        subjects,
        userRole: user.role,
        userId: user.userId,
        teacherId: user.teacherId,
        studentId: user.studentId,
        classId: user.classId
      }
    });
    
  } catch (error) {
    console.error('Error fetching user resources:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
