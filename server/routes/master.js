import express from 'express';
// import mysql from 'mysql2/promise';
import { Router } from 'express';

const router = Router();

// Create connection pool (same as server.js)
import pool from '../config/db.js';

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT ClassId, ClassName, ClassLetter FROM class ORDER BY ClassName, ClassLetter'
    );
    connection.release();

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get jobs (predefined list)
router.get('/jobs', (req, res) => {
  const jobs = ['កសិករ', 'គ្រូ', 'វិស្វករ', 'គ្រូពេទ្យ', 'អាជីវកម្ម'];
  res.json({ success: true, data: jobs });
});

// Get schools (predefined list)
router.get('/schools', (req, res) => {
  const schools = ['សាលាបឋមសិក្សា អ', 'សាលាបឋមសិក្សា ខ', 'សាលាអនុវិទ្យាល័យ អ'];
  res.json({ success: true, data: schools });
});

export default router;
