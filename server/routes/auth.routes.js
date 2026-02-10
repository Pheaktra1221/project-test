// server/routes/auth.routes.js
import express from 'express';
import { login, getProfile, updateProfile, listUsers, createUser, pingPresence } from '../controllers/auth.controller.js'; 
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Public: No token needed to login
router.post('/login', login);

// Protected: verifyToken must pass before reaching the controller
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/users', verifyToken, checkRole(['admin']), listUsers);
router.post('/users', verifyToken, checkRole(['admin']), createUser);
router.post('/presence', verifyToken, pingPresence);

export default router;
