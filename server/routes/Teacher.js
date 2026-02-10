import express from 'express';
import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ==================== TEACHER CRUD ENDPOINTS ====================
const emitRefresh = (req, resource) => {
  const io = req.app.get('io');
  if (io) io.emit('data_refresh', { resource });
};

// Get all teachers with pagination
router.get('/teachers', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 50);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT t.TeacherID, t.TeacherFirstName, t.TeacherLastName, 
             t.TeacherSex, t.TeacherAge, t.TeacherBirthDate, 
             t.TeacherBirthVillage, t.TeacherBirthCommune, t.TeacherBirthDistrict,
             t.TeacherBirthProvince, t.TeacherCurrentVillage, t.TeacherCurrentCommune,
             t.TeacherCurrentDistrict, t.TeacherCurrentProvince, t.JoinDate,
             t.Diploma, t.Subject1, t.Subject2, t.TeacherPic,
             s1.SubjectName as Subject1Name,
             s2.SubjectName as Subject2Name
      FROM teacher t 
      LEFT JOIN subject s1 ON t.Subject1 = s1.SubjectID
      LEFT JOIN subject s2 ON t.Subject2 = s2.SubjectID
    `;

    const params = [];
    if (search) {
      query += ` WHERE t.TeacherFirstName LIKE ? OR t.TeacherLastName LIKE ? OR t.TeacherID LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY CAST(t.TeacherID AS UNSIGNED) LIMIT ${limitNum} OFFSET ${offset}`;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    console.log('GET /api/teachers -> rows:', rows.length);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM teacher t';
    if (search) {
      countQuery += ` WHERE t.TeacherFirstName LIKE ? OR t.TeacherLastName LIKE ? OR t.TeacherID LIKE ?`;
    }

    const [countRows] = await connection.execute(
      countQuery,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );

    connection.release();

    res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single teacher
router.get('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT t.*, 
              s1.SubjectName as Subject1Name,
              s2.SubjectName as Subject2Name
       FROM teacher t 
       LEFT JOIN subject s1 ON t.Subject1 = s1.SubjectID
       LEFT JOIN subject s2 ON t.Subject2 = s2.SubjectID
       WHERE t.TeacherID = ?`,
      [id]
    );

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    res.json({ 
      success: true, 
      data: rows[0] 
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create teacher
router.post('/teachers', async (req, res) => {
  try {
    const body = req.body || {};
    const TeacherID = body.TeacherID ?? body.teacherid ?? body.teacherId ?? body.id ?? null;
    const TeacherFirstName = body.TeacherFirstName ?? body.TeacherFirstname ?? body.firstName ?? null;
    const TeacherLastName = body.TeacherLastName ?? body.TeacherLastname ?? body.lastName ?? null;
    const TeacherSex = body.TeacherSex ?? body.teacherSex ?? null;
    const TeacherAge = body.TeacherAge ?? body.age ?? null;
    const TeacherBirthDate = body.TeacherBirthDate ?? body.birthdate ?? null;
    const TeacherBirthVillage = body.TeacherBirthVillage ?? null;
    const TeacherBirthCommune = body.TeacherBirthCommune ?? null;
    const TeacherBirthDistrict = body.TeacherBirthDistrict ?? null;
    const TeacherBirthProvince = body.TeacherBirthProvince ?? null;
    const TeacherCurrentVillage = body.TeacherCurrentVillage ?? null;
    const TeacherCurrentCommune = body.TeacherCurrentCommune ?? null;
    const TeacherCurrentDistrict = body.TeacherCurrentDistrict ?? null;
    const TeacherCurrentProvince = body.TeacherCurrentProvince ?? null;
    const JoinDate = body.JoinDate ?? body.joinDate ?? null;
    const Diploma = body.Diploma ?? body.diploma ?? null;
    const Subject1 = body.Subject1 ?? body.subject1 ?? null;
    const Subject2 = body.Subject2 ?? body.subject2 ?? null;
    const TeacherPic = body.TeacherPic ?? body.TeacherPicture ?? body.pictureUrl ?? null;

    // Server-side validation
    if (!TeacherID || !TeacherFirstName || !TeacherLastName) {
      return res.status(400).json({ 
        success: false, 
        message: 'TeacherID, TeacherFirstName, and TeacherLastName are required' 
      });
    }

    const connection = await pool.getConnection();

    const query = `
      INSERT INTO teacher (
        TeacherID, TeacherFirstName, TeacherLastName, TeacherSex, TeacherAge,
        TeacherBirthDate, TeacherBirthVillage, TeacherBirthCommune,
        TeacherBirthDistrict, TeacherBirthProvince, TeacherCurrentVillage,
        TeacherCurrentCommune, TeacherCurrentDistrict, TeacherCurrentProvince,
        JoinDate, Diploma, Subject1, Subject2, TeacherPic,
        CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await connection.execute(query, [
      TeacherID, TeacherFirstName, TeacherLastName, TeacherSex, TeacherAge,
      TeacherBirthDate, TeacherBirthVillage, TeacherBirthCommune,
      TeacherBirthDistrict, TeacherBirthProvince, TeacherCurrentVillage,
      TeacherCurrentCommune, TeacherCurrentDistrict, TeacherCurrentProvince,
      JoinDate, Diploma, Subject1, Subject2, TeacherPic
    ]);

    connection.release();

    res.json({ 
      success: true, 
      message: 'Teacher created successfully', 
      TeacherID 
    });
    emitRefresh(req, 'teachers');
  } catch (error) {
    console.error('Create teacher error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher ID already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Update teacher
router.put('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove TeacherID from updates if present (should not update primary key)
    delete updates.TeacherID;
    delete updates.id;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    const connection = await pool.getConnection();

    // Add UpdatedAt timestamp
    updates.UpdatedAt = new Date();

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const [result] = await connection.execute(
      `UPDATE teacher SET ${fields} WHERE TeacherID = ?`, 
      values
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Teacher updated successfully' 
    });
    emitRefresh(req, 'teachers');
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Delete teacher
router.delete('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM teacher WHERE TeacherID = ?', 
      [id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Teacher deleted successfully' 
    });
    emitRefresh(req, 'teachers');
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Get next available teacher ID
router.get('/teachers-id/next', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT CAST(TeacherID AS UNSIGNED) as id FROM teacher 
       WHERE TeacherID REGEXP '^[0-9]+$' 
       ORDER BY CAST(TeacherID AS UNSIGNED)`
    );

    let nextId = 1;
    const existingIds = rows.map(r => r.id);

    // Find the first available ID (starting from 1)
    for (let i = 1; i <= 10000; i++) {
      if (!existingIds.includes(i)) {
        nextId = i;
        break;
      }
    }

    connection.release();
    res.json({ 
      success: true, 
      nextId 
    });
  } catch (error) {
    console.error('Get next teacher ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Get teachers count
router.get('/count/all', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as total FROM teacher'
    );
    connection.release();
    
    res.json({ 
      success: true, 
      total: rows[0].total 
    });
  } catch (error) {
    console.error('Get teachers count error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

export default router;
