import express from 'express';
import {
  createCheckout,
  updateShippingInfo,
  updateBillingInfo,
  createPaymentIntent,
  completeCheckout,
  getCheckout,
  getUserOrders,
  getOrder
} from '../controllers/checkoutController.js';
import { paymentLimiter } from '../utils/rateLimiter.js';
import { 
  createCheckoutSchema,
  updateShippingSchema,
  updateBillingSchema,
  completeCheckoutSchema
} from '../utils/validation.js';
import { AppError } from '../utils/errorHandler.js';
import { verifyPaymentAuth } from '../middleware/paymentAuth.js';

const router = express.Router();

// Apply rate limiting to all checkout routes
router.use(paymentLimiter);

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }
    next();
  };
};

// Checkout routes
router.post('/checkout',
  verifyPaymentAuth,
  validateRequest(createCheckoutSchema),
  createCheckout
);

router.get('/checkout/:checkoutId', verifyPaymentAuth, getCheckout);

router.patch('/checkout/:checkoutId/shipping',
  verifyPaymentAuth,
  validateRequest(updateShippingSchema),
  updateShippingInfo
);

router.patch('/checkout/:checkoutId/billing',
  verifyPaymentAuth,
  validateRequest(updateBillingSchema),
  updateBillingInfo
);

router.post('/checkout/:checkoutId/payment-intent',
  verifyPaymentAuth,
  createPaymentIntent
);

router.post('/checkout/:checkoutId/complete',
  verifyPaymentAuth,
  validateRequest(completeCheckoutSchema),
  completeCheckout
);

// Order routes
router.get('/users/:userId/orders', verifyPaymentAuth, getUserOrders);
router.get('/orders/:orderId', verifyPaymentAuth, getOrder);

export default router;
