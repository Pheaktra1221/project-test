import express from 'express';
// import mysql from 'mysql2/promise';
import { Router } from 'express';

const router = Router();

import pool from '../config/db.js';

const emitRefresh = (req, resource) => {
  const io = req.app.get('io');
  if (io) io.emit('data_refresh', { resource });
};

// Get all students with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 50);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT s.StudentID, s.StudentFirstname, s.StudentLastname, 
             s.StudentSex, s.ClassID, s.StudentBirthdate, s.StudentAge, 
             s.StudentBirthvillage, s.StudentBirthcommune, s.StudentBirthdistrict,
             s.StudentBirthProvince, s.StudentCurrentvillage, s.StudentCurrentcommune,
             s.StudentCurrentdistrict, s.Studentcurrentprovince, s.StudentFathername,
             s.StudentMothername, s.StudentFathernumber, s.StudentMothernumber,
             s.StudentFatherjob, s.StudentMotherJob, s.Fromschool, 
             s.StudentPicture,
             c.ClassName, c.ClassLetter
      FROM student s 
      LEFT JOIN class c ON s.ClassID = c.ClassId
    `;

    const params = [];
    if (search) {
      query += ` WHERE s.StudentFirstname LIKE ? OR s.StudentLastname LIKE ? OR s.StudentID LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Inline numeric LIMIT/OFFSET after sanitizing to avoid driver/SQL issues
    query += ` ORDER BY CAST(s.StudentID AS UNSIGNED) LIMIT ${limitNum} OFFSET ${offset}`;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    console.log('GET /api/students -> rows:', rows.length);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM student s';
    if (search) {
      countQuery += ` WHERE s.StudentFirstname LIKE ? OR s.StudentLastname LIKE ? OR s.StudentID LIKE ?`;
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
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT s.*, c.ClassName, c.ClassLetter 
       FROM student s 
       LEFT JOIN class c ON s.ClassID = c.ClassId 
       WHERE s.StudentID = ?`,
      [id]
    );
    console.log('GET /api/students/:id -> rows:', rows.length);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    // Accept different casing for StudentID and other fields sent from frontend
    const body = req.body || {}
    const StudentID = body.StudentID ?? body.studentid ?? body.studentId ?? body.id ?? null
    const StudentFirstname = body.StudentFirstname ?? body.StudentFirstName ?? body.firstName ?? null
    const StudentLastname = body.StudentLastname ?? body.StudentLastName ?? body.lastName ?? null
    const StudentSex = body.StudentSex ?? body.StudentSex ?? null
    const ClassID = body.ClassID ?? body.classid ?? null
    const StudentBirthdate = body.StudentBirthdate ?? body.birthdate ?? null
    const StudentAge = body.StudentAge ?? body.age ?? null
    const StudentBirthvillage = body.StudentBirthvillage ?? null
    const StudentBirthcommune = body.StudentBirthcommune ?? null
    const StudentBirthdistrict = body.StudentBirthdistrict ?? null
    const StudentBirthProvince = body.StudentBirthProvince ?? null
    const StudentCurrentvillage = body.StudentCurrentvillage ?? null
    const StudentCurrentcommune = body.StudentCurrentcommune ?? null
    const StudentCurrentdistrict = body.StudentCurrentdistrict ?? null
    const Studentcurrentprovince = body.Studentcurrentprovince ?? null
    const StudentFathername = body.StudentFathername ?? null
    const StudentMothername = body.StudentMothername ?? null
    const StudentFathernumber = body.StudentFathernumber ?? null
    const StudentMothernumber = body.StudentMothernumber ?? null
    const StudentFatherjob = body.StudentFatherjob ?? null
    const StudentMotherJob = body.StudentMotherJob ?? null
    const Enrolldate = body.Enrolldate ?? body.enrolldate ?? null
    const Fromschool = body.Fromschool ?? body.fromschool ?? null
    const StudentPicture = body.StudentPicture ?? null

    // Server-side validation: require StudentID and at least one name
    if (!StudentID || (!StudentFirstname && !StudentLastname)) {
      return res.status(400).json({ success: false, message: 'StudentID and at least one name are required' })
    }

    const connection = await pool.getConnection();

    const query = `
      INSERT INTO student (
        StudentID, StudentFirstname, StudentLastname, StudentSex, ClassID,
        StudentBirthdate, StudentAge, StudentBirthvillage, StudentBirthcommune,
        StudentBirthdistrict, StudentBirthProvince, StudentCurrentvillage,
        StudentCurrentcommune, StudentCurrentdistrict, Studentcurrentprovince,
        StudentFathername, StudentMothername, StudentFathernumber,
        StudentMothernumber, StudentFatherjob, StudentMotherJob, Enrolldate, Fromschool,
        StudentPicture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      StudentID, StudentFirstname, StudentLastname, StudentSex, ClassID,
      StudentBirthdate, StudentAge, StudentBirthvillage, StudentBirthcommune,
      StudentBirthdistrict, StudentBirthProvince, StudentCurrentvillage,
      StudentCurrentcommune, StudentCurrentdistrict, Studentcurrentprovince,
      StudentFathername, StudentMothername, StudentFathernumber,
      StudentMothernumber, StudentFatherjob, StudentMotherJob, Enrolldate, Fromschool,
      StudentPicture
    ]);

    connection.release();

    res.json({ success: true, message: 'Student created successfully', StudentID });
    emitRefresh(req, 'students');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const connection = await pool.getConnection();

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await connection.execute(`UPDATE student SET ${fields} WHERE StudentID = ?`, values);
    connection.release();

    res.json({ success: true, message: 'Student updated successfully' });
    emitRefresh(req, 'students');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.execute('DELETE FROM student WHERE StudentID = ?', [id]);
    connection.release();

    res.json({ success: true, message: 'Student deleted successfully' });
    emitRefresh(req, 'students');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get next available student ID
router.get('/next-id/next', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Lock table or use advisory lock
    await connection.execute('SELECT MAX(CAST(StudentID AS UNSIGNED)) FROM student FOR UPDATE');
    
    const [rows] = await connection.execute(
      `SELECT CAST(StudentID AS UNSIGNED) as id FROM student 
       WHERE StudentID REGEXP '^[0-9]+$' 
       ORDER BY CAST(StudentID AS UNSIGNED)`
    );
    
    // Generate next ID
    let nextId = 1;
    const existingIds = rows.map(r => r.id);
    
    for (let i = 1; i <= 10000; i++) {
      if (!existingIds.includes(i)) {
        nextId = i;
        break;
      }
    }
    
    await connection.commit();
    connection.release();
    
    res.json({ success: true, nextId });
  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
