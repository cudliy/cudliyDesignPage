import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

// Verify JWT token for payment operations
export const verifyPaymentAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access token required for payment operations', 401));
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(new AppError('Access token required for payment operations', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    // Get user from database
    // JWT token contains MongoDB _id, so we need to find by _id
    const user = await User.findById(decoded.id);

    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Add user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    logger.error('Payment Auth Error:', error);
    next(new AppError('Authentication failed', 401));
  }
};

// Check if user has active subscription
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Get user's active subscription
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user has active subscription
    if (user.subscription.type === 'free') {
      return res.status(402).json({
        success: false,
        error: 'Active subscription required',
        data: {
          currentPlan: 'free',
          upgradeRequired: true,
          message: 'Please upgrade your subscription to access this feature'
        }
      });
    }

    // Check if subscription is expired
    if (user.subscription.expiresAt && new Date() > user.subscription.expiresAt) {
      return res.status(402).json({
        success: false,
        error: 'Subscription expired',
        data: {
          currentPlan: user.subscription.type,
          expired: true,
          message: 'Your subscription has expired. Please renew to continue.'
        }
      });
    }

    req.subscription = user.subscription;
    next();
  } catch (error) {
    logger.error('Subscription Check Error:', error);
    next(new AppError('Failed to verify subscription', 500));
  }
};

// Check usage limits before processing
export const validateUsageLimits = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type } = req.body; // 'image' or 'model'

    // Get user's subscription and usage
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Free tier limits
    if (user.subscription.type === 'free') {
      const freeLimits = {
        images: 3,
        models: 1
      };

      if (type === 'image' && user.usage.imagesGenerated >= freeLimits.images) {
        return res.status(402).json({
          success: false,
          error: 'Usage limit exceeded',
          data: {
            limit: freeLimits.images,
            used: user.usage.imagesGenerated,
            type: 'image',
            upgradeRequired: true,
            message: 'You have reached your monthly image generation limit. Please upgrade to continue.'
          }
        });
      }

      if (type === 'model' && user.usage.modelsGenerated >= freeLimits.models) {
        return res.status(402).json({
          success: false,
          error: 'Usage limit exceeded',
          data: {
            limit: freeLimits.models,
            used: user.usage.modelsGenerated,
            type: 'model',
            upgradeRequired: true,
            message: 'You have reached your monthly model generation limit. Please upgrade to continue.'
          }
        });
      }
    }

    // For paid subscriptions, limits are checked in the service layer
    next();
  } catch (error) {
    logger.error('Usage Limits Check Error:', error);
    next(new AppError('Failed to check usage limits', 500));
  }
};

// Verify payment ownership
export const verifyPaymentOwnership = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { paymentIntentId, subscriptionId } = req.body;

    // Verify payment belongs to user
    if (paymentIntentId) {
      const payment = await Payment.findOne({ 
        stripePaymentIntentId: paymentIntentId,
        userId 
      });
      
      if (!payment) {
        return next(new AppError('Payment not found or access denied', 404));
      }
    }

    // Verify subscription belongs to user
    if (subscriptionId) {
      const subscription = await Subscription.findOne({ 
        stripeSubscriptionId: subscriptionId,
        userId 
      });
      
      if (!subscription) {
        return next(new AppError('Subscription not found or access denied', 404));
      }
    }

    next();
  } catch (error) {
    logger.error('Payment Ownership Check Error:', error);
    next(new AppError('Failed to verify payment ownership', 500));
  }
};

// Admin only middleware
export const requireAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user || user.role !== 'admin') {
      return next(new AppError('Admin access required', 403));
    }

    next();
  } catch (error) {
    logger.error('Admin Check Error:', error);
    next(new AppError('Failed to verify admin access', 500));
  }
};
