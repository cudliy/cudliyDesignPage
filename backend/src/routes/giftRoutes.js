import express from 'express';
import {
  createGift,
  getGift,
  trackGiftDownload,
  getGiftAnalytics,
  sendGiftEmail,
  getUserGifts
} from '../controllers/giftController.js';

const router = express.Router();

// Create a new gift share link
router.post('/create', createGift);

// Get gift details (for recipient)
router.get('/:giftId', getGift);

// Track gift download
router.post('/:giftId/download', trackGiftDownload);

// Get gift analytics (for sender)
router.get('/:giftId/analytics', getGiftAnalytics);

// Send gift email notification
router.post('/:giftId/send-email', sendGiftEmail);

// Get user's sent gifts
router.get('/user/:userId/gifts', getUserGifts);

export default router;