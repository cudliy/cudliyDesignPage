import express from 'express';
import { signup, login, me, googleAuth, appleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/apple', appleAuth);
router.get('/me', protect, me);

export default router;


