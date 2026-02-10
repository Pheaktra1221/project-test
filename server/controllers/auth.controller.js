// server/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const onlineUsers = new Map();
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

// Helper: create JWT
const createToken = (user) => {
  const payload = { id: user.ID, username: user.Username, role: user.Role };
  // if (user.TeacherID) payload.teacherId = user.TeacherID; // Column does not exist
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

    const connection = await pool.getConnection();
    try {
      // Removed TeacherID from query
      const [rows] = await connection.execute('SELECT ID, Username, Password, Role, create_date FROM user WHERE Username = ?', [username]);
      if (!rows || rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid username or password' });

      const user = rows[0];

      // Determine if stored password is a bcrypt hash
      const stored = user.Password || '';
      let passwordMatches = false;

      if (stored.startsWith('$2')) {
        // bcrypt hash
        passwordMatches = await bcrypt.compare(password, stored);
      } else {
        // legacy plaintext comparison
        passwordMatches = password === stored;
      }

      if (!passwordMatches) return res.status(401).json({ success: false, message: 'Invalid username or password' });

      // update login date
      await connection.execute('UPDATE user SET login_date = NOW() WHERE ID = ?', [user.ID]);

      const token = createToken(user);

      return res.json({ success: true, message: 'Login successful', user: { id: user.ID, username: user.Username, role: user.Role, createDate: user.create_date }, token });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Auth controller login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const connection = await pool.getConnection();
    try {
      // Try to select PhotoUrl and PhotoPath. If columns don't exist, this might fail, 
      // but assuming they exist based on previous code.
      const [rows] = await connection.execute('SELECT ID, Username, Role, create_date, PhotoUrl, PhotoPath FROM user WHERE ID = ?', [userId]);
      
      if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      const u = rows[0];
      
      // Normalize the photo URL
      // Check all possible casing that the DB driver might return
      const rawPhoto = u.PhotoUrl || u.photoUrl || u.PhotoPath || u.photoPath;
      
      return res.json({ 
        success: true, 
        data: { 
          id: u.ID, 
          username: u.Username, 
          role: u.Role, 
          createDate: u.create_date, 
          // Provide multiple casing for frontend compatibility
          photoUrl: rawPhoto,
          PhotoUrl: rawPhoto,
          photoPath: u.PhotoPath || u.photoPath,
          PhotoPath: u.PhotoPath || u.photoPath
        } 
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { username, password, photoUrl, photoPath } = req.body || {};
    const hasUpdates = username !== undefined || password !== undefined || photoUrl !== undefined || photoPath !== undefined;
    if (!hasUpdates) return res.status(400).json({ success: false, message: 'Nothing to update' });

    const connection = await pool.getConnection();
    try {
      const updates = [];
      const params = [];
      if (username !== undefined && String(username).trim() !== '') {
        updates.push('Username = ?');
        params.push(String(username).trim());
      }
      if (password !== undefined && String(password) !== '') {
        const hash = await bcrypt.hash(String(password), 10);
        updates.push('Password = ?');
        params.push(hash);
      }
      if (photoUrl !== undefined) {
        updates.push('PhotoUrl = ?');
        params.push(photoUrl);
      }
      if (photoPath !== undefined) {
        updates.push('PhotoPath = ?');
        params.push(photoPath);
      }
      if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });

      params.push(userId);
      const sql = `UPDATE user SET ${updates.join(', ')} WHERE ID = ?`;
      await connection.execute(sql, params);
      return res.json({ success: true, message: 'Profile updated' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const pingPresence = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  onlineUsers.set(userId, Date.now());
  return res.json({ success: true });
};

export const listUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT ID, Username, Role, create_date, login_date, PhotoUrl, PhotoPath FROM user ORDER BY ID DESC'
      );
      const now = Date.now();
      const data = rows.map((u) => {
        const lastSeen = onlineUsers.get(u.ID) || null;
        const isOnline = lastSeen ? now - lastSeen < ONLINE_WINDOW_MS : false;
        return {
          id: u.ID,
          username: u.Username,
          role: u.Role,
          createDate: u.create_date,
          loginDate: u.login_date,
          photoUrl: u.PhotoUrl,
          photoPath: u.PhotoPath,
          isOnline,
          lastSeen
        };
      });
      return res.json({ success: true, data });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.execute('SELECT ID FROM user WHERE Username = ?', [username]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
      const hash = await bcrypt.hash(String(password), 10);
      const roleValue = role || 'user';
      const [result] = await connection.execute(
        'INSERT INTO user (Username, Password, Role, create_date) VALUES (?, ?, ?, NOW())',
        [String(username).trim(), hash, roleValue]
      );
      return res.json({
        success: true,
        message: 'User created',
        userId: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
