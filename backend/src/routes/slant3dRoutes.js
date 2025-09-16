import express from 'express';
import {
  getPricingEstimate,
  createOrder,
  getShippingEstimate,
  getOrderTracking,
  getAllOrders,
  cancelOrder
} from '../controllers/slant3dController.js';

const router = express.Router();

// Get pricing estimate
router.post('/pricing/estimate', getPricingEstimate);

// Create order
router.post('/order', createOrder);

// Get shipping estimate
router.post('/shipping/estimate', getShippingEstimate);

// Get order tracking
router.get('/order/:orderId/tracking', getOrderTracking);

// Get all orders
router.get('/orders', getAllOrders);

// Cancel order
router.delete('/order/:orderId', cancelOrder);

export default router;