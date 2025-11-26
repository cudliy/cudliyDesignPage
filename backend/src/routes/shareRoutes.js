import express from 'express';
import { generateShareData, getShareAnalytics, trackShare } from '../controllers/shareController.js';

const router = express.Router();

// Generate personalized sharing data for a design
router.get('/designs/:designId/share-data', generateShareData);

// Get sharing analytics for a design
router.get('/designs/:designId/share-analytics', getShareAnalytics);

// Track share event
router.post('/designs/:designId/track-share', trackShare);

export default router;