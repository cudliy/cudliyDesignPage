import express from 'express';
import {
  // Customer Management
  createCustomer,
  getCustomer,
  updateCustomer,
  
  // Payment Methods
  createPaymentMethod,
  attachPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
  
  // Payment Intents
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent,
  
  // Subscriptions
  createSubscription,
  getSubscription,
  getUserSubscriptions,
  cancelSubscription,
  updateSubscription,
  
  // Products and Pricing
  getProducts,
  getPrices,
  
  // Payment History and Usage
  getPaymentHistory,
  createRefund,
  trackUsage,
  checkUsageLimits
} from '../controllers/paymentController.js';
import { paymentLimiter } from '../utils/rateLimiter.js';
import { 
  createCustomerSchema,
  createPaymentIntentSchema,
  createSubscriptionSchema,
  trackUsageSchema
} from '../utils/validation.js';
import { AppError } from '../utils/errorHandler.js';
import { 
  verifyPaymentAuth, 
  requireActiveSubscription, 
  checkUsageLimits,
  verifyPaymentOwnership 
} from '../middleware/paymentAuth.js';

const router = express.Router();

// Apply rate limiting to all payment routes
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

// Customer Management Routes
router.post('/customers', 
  verifyPaymentAuth,
  validateRequest(createCustomerSchema),
  createCustomer
);

router.get('/customers/:userId', verifyPaymentAuth, getCustomer);
router.patch('/customers/:userId', verifyPaymentAuth, updateCustomer);

// Payment Methods Routes
router.post('/customers/:userId/payment-methods', verifyPaymentAuth, createPaymentMethod);
router.post('/customers/:userId/payment-methods/:paymentMethodId/attach', verifyPaymentAuth, attachPaymentMethod);
router.get('/customers/:userId/payment-methods', verifyPaymentAuth, getPaymentMethods);
router.post('/customers/:userId/payment-methods/:paymentMethodId/default', verifyPaymentAuth, setDefaultPaymentMethod);

// Payment Intents Routes
router.post('/payment-intents',
  verifyPaymentAuth,
  validateRequest(createPaymentIntentSchema),
  createPaymentIntent
);

router.post('/payment-intents/:paymentIntentId/confirm', verifyPaymentAuth, confirmPaymentIntent);
router.get('/payment-intents/:paymentIntentId', verifyPaymentAuth, getPaymentIntent);

// Subscription Routes
router.post('/subscriptions',
  verifyPaymentAuth,
  validateRequest(createSubscriptionSchema),
  createSubscription
);

router.get('/subscriptions/:subscriptionId', verifyPaymentAuth, getSubscription);
router.get('/users/:userId/subscriptions', verifyPaymentAuth, getUserSubscriptions);
router.patch('/subscriptions/:subscriptionId', verifyPaymentAuth, updateSubscription);
router.delete('/subscriptions/:subscriptionId', verifyPaymentAuth, cancelSubscription);

// Products and Pricing Routes
router.get('/products', getProducts);
router.get('/products/:productId/prices', getPrices);

// Payment History and Usage Routes
router.get('/users/:userId/payments', verifyPaymentAuth, getPaymentHistory);
router.post('/refunds', verifyPaymentAuth, verifyPaymentOwnership, createRefund);
router.post('/users/:userId/usage/track',
  verifyPaymentAuth,
  checkUsageLimits,
  validateRequest(trackUsageSchema),
  trackUsage
);
router.get('/users/:userId/usage/limits', verifyPaymentAuth, checkUsageLimits);

export default router;
