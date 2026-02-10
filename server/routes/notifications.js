import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

const MAX_NOTIFICATIONS = 50;
const notifications = [];

const addNotification = (payload) => {
  notifications.unshift(payload);
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.pop();
  }
};

router.get('/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: notifications });
});

router.post('/notifications/broadcast', verifyToken, checkRole(['admin']), (req, res) => {
  const { title, message, type } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  const notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type: type || 'info',
    title,
    message,
    time: new Date().toISOString(),
    sender: req.user?.username || 'admin'
  };

  addNotification(notification);

  const io = req.app.get('io');
  if (io) io.emit('broadcast_notification', notification);

  res.json({ success: true, data: notification });
});

export default router;
