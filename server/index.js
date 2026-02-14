import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import studentsRouter from './routes/students.js';
import addressRouter from './routes/address.js';
import masterRouter from './routes/master.js';
import uploadRouter from './routes/upload.js';
import classRoutes from './routes/Classapi.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import statisticsRoutes from './routes/statistics.js';
import classListRoutes from './routes/ClassListAPI.js'; 
import teacherRoutes from './routes/Teacher.js';
import subjectRouter from './routes/subject.js';
import attendanceRouter from './routes/attendance.js';
import attendanceStatsRouter from './routes/attendance-stats.js';
import notificationsRouter from './routes/notifications.js';
import scoresRouter from './routes/scores.js';
import rankingsRouter from './routes/rankings.js';
import authRoutes from './routes/auth.routes.js';
import legacyAuthRouter from './routes/legacy-auth.js';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (check current and parent directory)
dotenv.config();
if (!process.env.PORT) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const app = express();

// CORS configuration - Allow all origins
const corsOptions = {
  origin: true, // This reflects the request origin back
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Apply CORS middleware to all routes first
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Create HTTP server
const httpServer = createServer(app);

// Socket.IO with explicit CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: true, // This allows any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'], // Polling first for better compatibility
  path: '/socket.io/',
  // Add these settings to ensure CORS headers are set on polling responses
  allowRequest: (req, callback) => {
    callback(null, true); // Allow all requests
  }
});

// Middleware to set CORS headers for all requests including socket.io polling
app.use((req, res, next) => {
  // Set CORS headers for every request
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Listen for ranking updates triggers
  socket.on('trigger_ranking_update', (data) => {
    // Broadcast to all clients to refresh their rankings
    io.emit('ranking_update', data);
  });
});

// Make io available globally or via app
app.set('io', io);

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// TiDB Connection Pool
import pool from './config/db.js';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.type('text/plain').send('Backend service is running. Use /api/health');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api', legacyAuthRouter); // Legacy login/register
app.use('/api/students', studentsRouter);
app.use('/api/address', addressRouter);
app.use('/api/master', masterRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/class', classRoutes);
// Compatibility: some clients expect /api/classes
app.use('/api/classes', classRoutes);
app.use('/api/classlist', classListRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/attendance', attendanceStatsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/rankings', rankingsRouter);

// Base mounts for non-prefixed requests
app.use('/auth', authRoutes);
app.use('/notifications', notificationsRouter);
app.use('/', legacyAuthRouter);
app.use('/students', studentsRouter);
app.use('/address', addressRouter);
app.use('/master', masterRouter);
app.use('/upload', uploadRouter);
app.use('/statistics', statisticsRoutes);
app.use('/class', classRoutes);
app.use('/classes', classRoutes);
app.use('/classlist', classListRoutes);
app.use('/teachers', teacherRoutes);
app.use('/subjects', subjectRouter);
app.use('/attendance', attendanceRouter);
app.use('/attendance', attendanceStatsRouter);
app.use('/scores', scoresRouter);
app.use('/rankings', rankingsRouter);

// Serve uploaded fallback files
const uploadsDir = path.join(process.cwd(), 'uploads')
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }) } catch (e) {}
app.use('/uploads', express.static(uploadsDir))
app.use('/api/uploads', express.static(uploadsDir))

// Serve Vue app static files (Production)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0'

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);

  // List non-internal IPv4 addresses
  try {
    const nets = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }
    if (addresses.length > 0) {
      console.log('Accessible on your LAN at:')
      addresses.forEach(a => console.log(`  http://${a}:${PORT}/`))
    } else {
      console.log('No non-internal IPv4 addresses detected. Use localhost or check network settings.')
    }
  } catch (e) {
    // best-effort
  }
});

// Global error handler: always return JSON for errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: err?.message || 'Internal Server Error' });
});