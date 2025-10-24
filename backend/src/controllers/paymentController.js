import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import stripeService from '../services/stripeService.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

// Customer Management
export const createCustomer = async (req, res, next) => {
  try {
    const { userId, email, name, metadata = {} } = req.body;

    const customer = await stripeService.createCustomer(userId, email, name, metadata);

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      }
    });
  } catch (error) {
    logger.error('Create Customer Error:', error);
    next(new AppError(error.message || 'Failed to create customer', 500));
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const customer = await stripeService.getCustomer(userId);

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Get Customer Error:', error);
    next(new AppError(error.message || 'Failed to get customer', 500));
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const customer = await stripeService.updateCustomer(userId, updates);

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Update Customer Error:', error);
    next(new AppError(error.message || 'Failed to update customer', 500));
  }
};

// Payment Methods
export const createPaymentMethod = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, card } = req.body;

    const customer = await stripeService.getCustomer(userId);
    const paymentMethod = await stripeService.createPaymentMethod(type, card, customer.id);

    res.json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    logger.error('Create Payment Method Error:', error);
    next(new AppError(error.message || 'Failed to create payment method', 500));
  }
};

export const attachPaymentMethod = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { paymentMethodId } = req.body;

    const customer = await stripeService.getCustomer(userId);
    const paymentMethod = await stripeService.attachPaymentMethod(paymentMethodId, customer.id);

    res.json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    logger.error('Attach Payment Method Error:', error);
    next(new AppError(error.message || 'Failed to attach payment method', 500));
  }
};

export const getPaymentMethods = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const customer = await stripeService.getCustomer(userId);
    const paymentMethods = await stripeService.getPaymentMethods(customer.id);

    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    logger.error('Get Payment Methods Error:', error);
    next(new AppError(error.message || 'Failed to get payment methods', 500));
  }
};

export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { paymentMethodId } = req.body;

    const customer = await stripeService.getCustomer(userId);
    const updatedCustomer = await stripeService.setDefaultPaymentMethod(customer.id, paymentMethodId);

    res.json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    logger.error('Set Default Payment Method Error:', error);
    next(new AppError(error.message || 'Failed to set default payment method', 500));
  }
};

// Payment Intents
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { userId, amount, currency = 'usd', metadata = {} } = req.body;

    const customer = await stripeService.getCustomer(userId);
    const paymentIntent = await stripeService.createPaymentIntent(
      amount, 
      currency, 
      customer.id, 
      { userId, ...metadata }
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    logger.error('Create Payment Intent Error:', error);
    next(new AppError(error.message || 'Failed to create payment intent', 500));
  }
};

export const confirmPaymentIntent = async (req, res, next) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        nextAction: paymentIntent.next_action
      }
    });
  } catch (error) {
    logger.error('Confirm Payment Intent Error:', error);
    next(new AppError(error.message || 'Failed to confirm payment intent', 500));
  }
};

export const getPaymentIntent = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    res.json({
      success: true,
      data: paymentIntent
    });
  } catch (error) {
    logger.error('Get Payment Intent Error:', error);
    next(new AppError(error.message || 'Failed to get payment intent', 500));
  }
};

// Subscriptions
export const createSubscription = async (req, res, next) => {
  try {
    const { userId, planType, interval, metadata = {} } = req.body;

    logger.info(`Creating subscription checkout for user: ${userId}, plan: ${planType}, interval: ${interval}`);

    // Get or create customer
    const customer = await stripeService.getCustomer(userId);
    logger.info(`Customer retrieved/created: ${customer.id}`);
    
    // Get products to find the correct price ID
    const products = await stripeService.getProducts();
    let targetPriceId = null;
    
    // Find the price ID based on plan type and interval
    for (const product of products) {
      if (product.metadata?.planType === planType) {
        const prices = await stripeService.getPrices(product.id);
        const targetPrice = prices.find(price => 
          price.recurring?.interval === interval && 
          price.active === true
        );
        if (targetPrice) {
          targetPriceId = targetPrice.id;
          logger.info(`Found price ID: ${targetPriceId} for plan: ${planType}, interval: ${interval}`);
          break;
        }
      }
    }

    if (!targetPriceId) {
      logger.error(`No price found for plan type: ${planType} with interval: ${interval}`);
      return next(new AppError(`No price found for plan type: ${planType} with interval: ${interval}`, 400));
    }

    // Create Stripe Checkout Session for subscription payment
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.cudliy.com';
    const checkoutSession = await stripeService.createCheckoutSession({
      customerId: customer.id,
      priceId: targetPriceId,
      mode: 'subscription',
      successUrl: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/pricing`,
      metadata: {
        userId,
        planType,
        interval,
        ...metadata
      }
    });

    logger.info(`Checkout session created: ${checkoutSession.id} for user: ${userId}`);
    logger.info(`Metadata attached: ${JSON.stringify({ userId, planType, interval })}`);

    res.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id
      }
    });
  } catch (error) {
    logger.error('Create Subscription Error:', error);
    logger.error('Error details:', { userId: req.body?.userId, planType: req.body?.planType, error: error.message });
    next(new AppError(error.message || 'Failed to create subscription', 500));
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripeService.getSubscription(subscriptionId);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Get Subscription Error:', error);
    next(new AppError(error.message || 'Failed to get subscription', 500));
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };

    const subscriptions = await Subscription.find(filter, null, options);
    const total = await Subscription.countDocuments(filter);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get User Subscriptions Error:', error);
    next(new AppError('Failed to get user subscriptions', 500));
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { reason = 'user_requested' } = req.body;

    const subscription = await stripeService.cancelSubscription(subscriptionId, reason);

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
      }
    });
  } catch (error) {
    logger.error('Cancel Subscription Error:', error);
    next(new AppError(error.message || 'Failed to cancel subscription', 500));
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const updates = req.body;

    const subscription = await stripeService.updateSubscription(subscriptionId, updates);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Update Subscription Error:', error);
    next(new AppError(error.message || 'Failed to update subscription', 500));
  }
};

// Products and Pricing
export const getProducts = async (req, res, next) => {
  try {
    const { active = true } = req.query;

    const products = await stripeService.getProducts(active === 'true');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    logger.error('Get Products Error:', error);
    next(new AppError(error.message || 'Failed to get products', 500));
  }
};

export const getPrices = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const prices = await stripeService.getPrices(productId);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    logger.error('Get Prices Error:', error);
    next(new AppError(error.message || 'Failed to get prices', 500));
  }
};

// Payment History
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };

    const payments = await Payment.find(filter, null, options);
    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get Payment History Error:', error);
    next(new AppError('Failed to get payment history', 500));
  }
};

// Refunds
export const createRefund = async (req, res, next) => {
  try {
    const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;

    const refund = await stripeService.createRefund(paymentIntentId, amount, reason);

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason
      }
    });
  } catch (error) {
    logger.error('Create Refund Error:', error);
    next(new AppError(error.message || 'Failed to create refund', 500));
  }
};

// Usage Tracking
export const trackUsage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, amount = 1 } = req.body; // type: 'image' or 'model'

    const user = await User.findOne({ id: userId });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update usage counters
    if (type === 'image') {
      user.usage.imagesGenerated += amount;
    } else if (type === 'model') {
      user.usage.modelsGenerated += amount;
    }
    user.usage.lastUsed = new Date();
    await user.save();

    // Check subscription limits
    const subscription = await Subscription.findOne({ 
      userId, 
      status: { $in: ['active', 'trialing'] } 
    });

    if (subscription) {
      const limits = subscription.plan.limits;
      
      // Ensure usage object exists (fix for Studio plan not tracking usage)
      if (!subscription.usage) {
        subscription.usage = {
          imagesGenerated: 0,
          modelsGenerated: 0,
          storageUsed: 0,
          lastReset: new Date()
        };
      }
      
      const usage = subscription.usage;

      if (type === 'image') {
        usage.imagesGenerated += amount;
      } else if (type === 'model') {
        usage.modelsGenerated += amount;
      }

      // Check if limits exceeded
      const exceeded = 
        (limits.imagesPerMonth > 0 && usage.imagesGenerated > limits.imagesPerMonth) ||
        (limits.modelsPerMonth > 0 && usage.modelsGenerated > limits.modelsPerMonth);

      if (exceeded) {
        return res.status(402).json({
          success: false,
          error: 'Usage limit exceeded',
          data: {
            limits,
            usage,
            upgradeRequired: true
          }
        });
      }

      await subscription.save();
    }

    res.json({
      success: true,
      data: {
        usage: user.usage,
        subscription: subscription?.plan || null
      }
    });
  } catch (error) {
    logger.error('Track Usage Error:', error);
    next(new AppError('Failed to track usage', 500));
  }
};

// Check Usage Limits
export const checkUsageLimits = async (req, res, next) => {
  try {
    const { userId } = req.params;

    logger.info(`Checking usage limits for user: ${userId}`);

    // Check for active subscription
    const subscription = await Subscription.findOne({ 
      userId, 
      status: { $in: ['active', 'trialing'] } 
    }).sort({ createdAt: -1 }); // Get the most recent active subscription

    // Also get user data
    const user = await User.findOne({ id: userId });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!subscription) {
      // Check if user has Studio/Pro plan in User model as fallback
      const userPlan = user.subscription?.type;
      const isStudioOrPro = userPlan === 'pro' || userPlan === 'enterprise';
      
      if (isStudioOrPro) {
        logger.info(`User ${userId} has ${userPlan} plan in User model (no active subscription found). Giving unlimited access.`);
        
        const studioLimits = {
          imagesPerMonth: -1, // unlimited
          modelsPerMonth: -1, // unlimited
          storageGB: 100,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true
        };

        return res.json({
          success: true,
          data: {
            plan: userPlan,
            subscription: null,
            limits: studioLimits,
            usage: {
              imagesGenerated: user.usage.imagesGenerated || 0,
              modelsGenerated: user.usage.modelsGenerated || 0,
              storageUsed: 0
            },
            remaining: {
              images: -1, // unlimited
              models: -1  // unlimited
            }
          }
        });
      }

      // Free tier limits
      const freeLimits = {
        imagesPerMonth: 3,
        modelsPerMonth: 1,
        storageGB: 1,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false
      };

      logger.info(`User ${userId} is on free tier. Usage: ${JSON.stringify(user.usage)}`);

      return res.json({
        success: true,
        data: {
          plan: 'free',
          subscription: null,
          limits: freeLimits,
          usage: {
            imagesGenerated: user.usage.imagesGenerated || 0,
            modelsGenerated: user.usage.modelsGenerated || 0,
            storageUsed: 0
          },
          remaining: {
            images: Math.max(0, freeLimits.imagesPerMonth - (user.usage.imagesGenerated || 0)),
            models: Math.max(0, freeLimits.modelsPerMonth - (user.usage.modelsGenerated || 0))
          }
        }
      });
    }

    // User has active subscription
    const limits = subscription.plan.limits;
    const usage = subscription.usage || { imagesGenerated: 0, modelsGenerated: 0, storageUsed: 0 };

    logger.info(`User ${userId} has ${subscription.plan.type} subscription. Limits: ${JSON.stringify(limits)}, Usage: ${JSON.stringify(usage)}`);
    logger.info(`User subscription in User model: ${JSON.stringify(user.subscription)}`);

    // Special handling for Studio/Pro plans - give unlimited access
    const isStudioOrPro = subscription.plan.type === 'pro' || subscription.plan.type === 'enterprise';
    const effectiveLimits = isStudioOrPro ? {
      imagesPerMonth: -1, // unlimited
      modelsPerMonth: -1, // unlimited
      storageGB: limits.storageGB,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true
    } : limits;

    res.json({
      success: true,
      data: {
        plan: subscription.plan.type,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.billing.currentPeriodEnd,
          planName: subscription.plan.name
        },
        limits: effectiveLimits,
        usage,
        remaining: {
          images: effectiveLimits.imagesPerMonth === -1 ? -1 : Math.max(0, effectiveLimits.imagesPerMonth - usage.imagesGenerated),
          models: effectiveLimits.modelsPerMonth === -1 ? -1 : Math.max(0, effectiveLimits.modelsPerMonth - usage.modelsGenerated)
        }
      }
    });
  } catch (error) {
    logger.error('Check Usage Limits Error:', error);
    next(new AppError('Failed to check usage limits', 500));
  }
};
