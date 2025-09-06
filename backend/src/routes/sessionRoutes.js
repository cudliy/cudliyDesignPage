import express from 'express';
import { getSession } from '../controllers/sessionController.js';

const router = express.Router();

// Session routes
router.get('/:sessionId', getSession);

export default router;
