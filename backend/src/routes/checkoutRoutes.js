import express from 'express';
import {
  createStripeCheckout,
  createCheckout,
  updateShippingInfo,
  updateBillingInfo,
  createPaymentIntent,
  completeCheckout,
  getCheckout,
  getUserOrders,
  getOrder,
  handleCheckoutSessionCompleted
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

// Handle CORS preflight requests
router.options('/stripe', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Checkout routes (temporarily without auth for development)
router.post('/stripe',
  validateRequest(createCheckoutSchema),
  createStripeCheckout
);

router.post('/',
  validateRequest(createCheckoutSchema),
  createCheckout
);

router.get('/:checkoutId', getCheckout);

router.patch('/:checkoutId/shipping',
  validateRequest(updateShippingSchema),
  updateShippingInfo
);

router.patch('/:checkoutId/billing',
  validateRequest(updateBillingSchema),
  updateBillingInfo
);

router.post('/:checkoutId/payment-intent',
  createPaymentIntent
);

router.post('/:checkoutId/complete',
  validateRequest(completeCheckoutSchema),
  completeCheckout
);

// Order routes (temporarily without auth for development)
router.get('/users/:userId/orders', getUserOrders);
router.get('/orders/:orderId', getOrder);

export default router;
