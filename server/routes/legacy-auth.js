import express from 'express';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Login endpoint (keep for existing clients)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        'SELECT ID, Username, Role, create_date FROM user WHERE Username = ? AND Password = ?',
        [username, password]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
        });
      }

      const user = rows[0];

      await connection.query('UPDATE user SET login_date = NOW() WHERE ID = ?', [
        user.ID,
      ]);

      const payload = { id: user.ID, username: user.Username, role: user.Role };
      // if (user.TeacherID) payload.teacherId = user.TeacherID; // Column does not exist
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.ID,
          username: user.Username,
          role: user.Role,
          createDate: user.create_date,
        },
        token
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

// Register endpoint (keep for existing clients)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const connection = await pool.getConnection();

    try {
      const [existingUser] = await connection.query(
        'SELECT ID FROM user WHERE Username = ?',
        [username]
      );

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
      }

      const [result] = await connection.query(
        'INSERT INTO user (Username, Password, Role, create_date) VALUES (?, ?, ?, NOW())',
        [username, password, role || 'user']
      );

      res.json({
        success: true,
        message: 'User registered successfully',
        userId: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

export default router;
