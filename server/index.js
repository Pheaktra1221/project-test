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
const httpServer = createServer(app);
const defaultOrigins = ['https://*.pages.dev', 'https://*.koyeb.app'];
const allowedOrigins = Array.from(new Set([...(process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean), ...defaultOrigins]));
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length ? (allowedOrigins.includes('*') ? true : allowedOrigins) : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
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
const parseOrigins = (s) => s ? s.split(',').map(v => v.trim()).filter(Boolean) : [];
const configuredOrigins = Array.from(new Set([...(parseOrigins(process.env.CORS_ORIGIN)), ...defaultOrigins]));
const isWildcardMatch = (pattern, origin) => {
  if (!pattern.startsWith('https://*.')) return false;
  const domain = pattern.slice('https://*.'.length);
  if (!origin.startsWith('https://')) return false;
  const o = origin.replace('https://', '');
  return o === domain || o.endsWith('.' + domain);
};
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (!configuredOrigins.length) return true;
  if (configuredOrigins.includes('*')) return true;
  if (configuredOrigins.includes(origin)) return true;
  for (const p of configuredOrigins) {
    if (isWildcardMatch(p, origin)) return true;
  }
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
  return false;
};
const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Enable pre-flight across-the-board
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
app.use('/api/auth', authRoutes); // Add the new auth routes
app.use('/api', legacyAuthRouter); // Legacy login/register
app.use('/api', studentsRouter);
app.use('/api/address', addressRouter);
app.use('/api/master', masterRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/class', classRoutes);
// Compatibility: some clients expect /api/classes
app.use('/api/classes', classRoutes);
app.use('/api/classlist', classListRoutes);
app.use('/api', teacherRoutes);
app.use('/api/subjects', subjectRouter);
app.use('/api', attendanceRouter);
app.use('/api', attendanceStatsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api', notificationsRouter);

// Serve uploaded fallback files
const uploadsDir = path.join(process.cwd(), 'uploads')
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }) } catch (e) {}
app.use('/uploads', express.static(uploadsDir))

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
// Ensure leftover route mounts (kept for compatibility)
app.use('/api/class', classRoutes);

// Global error handler: always return JSON for errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: err?.message || 'Internal Server Error' });
});

// Start server on all network interfaces
