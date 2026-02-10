import express from 'express';
import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT SubjectID, SubjectName FROM subject ORDER BY SubjectName'
    );
    connection.release();
    res.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Create subject
router.post('/', async (req, res) => {
  try {
    const { SubjectID, SubjectName } = req.body;
    
    if (!SubjectID || !SubjectName) {
      return res.status(400).json({ 
        success: false, 
        message: 'SubjectID and SubjectName are required' 
      });
    }

    const connection = await pool.getConnection();
    
    await connection.execute(
      'INSERT INTO subject (SubjectID, SubjectName) VALUES (?, ?)',
      [SubjectID, SubjectName]
    );

    connection.release();
    
    res.json({ 
      success: true, 
      message: 'Subject created successfully' 
    });
  } catch (error) {
    console.error('Create subject error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject ID already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

export default router;