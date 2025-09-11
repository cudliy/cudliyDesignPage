import express from 'express';
import stripeService from '../services/stripeService.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return next(new AppError('Missing stripe-signature header', 400));
    }

    const result = await stripeService.handleWebhook(req.body, signature);
    
    res.json(result);
  } catch (error) {
    logger.error('Webhook Error:', error);
    next(new AppError('Webhook processing failed', 400));
  }
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
