import stripeService from '../services/stripeService.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';

/**
 * Manual subscription sync endpoint
 * Use this when webhook fails or to force sync with Stripe
 */
export const syncSubscriptionFromStripe = async (req, res, next) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId) {
      return next(new AppError('userId is required', 400));
    }

    logger.info(`🔄 Manual sync requested for user: ${userId}, session: ${sessionId || 'N/A'}`);

    // If sessionId provided, retrieve the session from Stripe
    if (sessionId) {
      const session = await stripeService.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });

      logger.info(`📦 Retrieved Stripe session: ${JSON.stringify({
        id: session.id,
        mode: session.mode,
        payment_status: session.payment_status,
        subscription: session.subscription?.id,
        customer: session.customer?.id,
        metadata: session.metadata
      })}`);

      if (session.mode === 'subscription' && session.subscription) {
        // Get subscription details from Stripe
        const stripeSubscription = typeof session.subscription === 'string' 
          ? await stripeService.stripe.subscriptions.retrieve(session.subscription)
          : session.subscription;

        logger.info(`📦 Stripe subscription: ${JSON.stringify({
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          customer: stripeSubscription.customer,
          current_period_end: stripeSubscription.current_period_end,
          items: stripeSubscription.items.data.map(item => ({
            price: item.price.id,
            product: item.price.product
          }))
        })}`);

        // Check if subscription already exists in our DB
        let subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });

        if (subscription) {
          logger.info(`✅ Subscription already exists in DB: ${subscription.id}`);
          
          // Update if needed
          subscription.status = stripeSubscription.status;
          subscription.billing.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
          subscription.billing.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          await subscription.save();
          
          logger.info(`✅ Subscription updated: ${subscription.id}`);
        } else {
          // Create new subscription
          const { planType, interval } = session.metadata || {};
          
          if (!planType) {
            return next(new AppError('Missing planType in session metadata', 400));
          }

          const priceId = stripeSubscription.items.data[0].price.id;
          const productId = stripeSubscription.items.data[0].price.product;

          subscription = new Subscription({
            userId,
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: stripeSubscription.customer,
            stripePriceId: priceId,
            productId: productId,
            status: stripeSubscription.status,
            plan: {
              name: planType === 'pro' ? 'Studio' : planType === 'premium' ? 'Creator' : 'Basic',
              type: planType,
              price: {
                amount: stripeSubscription.items.data[0].price.unit_amount,
                currency: stripeSubscription.items.data[0].price.currency,
                interval: stripeSubscription.items.data[0].price.recurring.interval,
                intervalCount: stripeSubscription.items.data[0].price.recurring.interval_count
              },
              features: stripeService.getPlanFeatures(planType),
              limits: stripeService.getPlanLimits(planType)
            },
            billing: {
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
            },
            usage: {
              imagesGenerated: 0,
              modelsGenerated: 0,
              storageUsed: 0,
              lastReset: new Date()
            }
          });

          await subscription.save();
          logger.info(`✅ Subscription created: ${subscription.id}`);
        }

        // Update user subscription info
        const user = await User.findOne({ id: userId });
        if (user) {
          user.subscription = {
            type: subscription.plan.type,
            expiresAt: subscription.billing.currentPeriodEnd,
            features: subscription.plan.features,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            status: subscription.status
          };
          await user.save();
          logger.info(`✅ User subscription info updated for: ${userId}`);
        }

        return res.json({
          success: true,
          message: 'Subscription synced successfully',
          data: {
            subscription: {
              id: subscription.id,
              plan: subscription.plan.type,
              status: subscription.status,
              currentPeriodEnd: subscription.billing.currentPeriodEnd
            }
          }
        });
      } else {
        return next(new AppError('Session is not a subscription or subscription not found', 400));
      }
    }

    // If no sessionId, try to find subscription by userId from Stripe
    const customer = await stripeService.getCustomer(userId);
    const stripeSubscriptions = await stripeService.stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10
    });

    logger.info(`📦 Found ${stripeSubscriptions.data.length} Stripe subscriptions for customer: ${customer.id}`);

    if (stripeSubscriptions.data.length === 0) {
      return res.json({
        success: true,
        message: 'No subscriptions found in Stripe',
        data: { subscriptions: [] }
      });
    }

    // Sync all subscriptions
    const syncedSubscriptions = [];
    for (const stripeSub of stripeSubscriptions.data) {
      let subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
      
      if (!subscription) {
        // Create subscription - need to infer plan type from price
        const priceId = stripeSub.items.data[0].price.id;
        let planType = 'premium'; // default
        
        // Try to determine plan type from price metadata or nickname
        const price = await stripeService.stripe.prices.retrieve(priceId);
        if (price.nickname && price.nickname.toLowerCase().includes('pro')) {
          planType = 'pro';
        } else if (price.nickname && price.nickname.toLowerCase().includes('studio')) {
          planType = 'pro';
        } else if (price.nickname && price.nickname.toLowerCase().includes('creator')) {
          planType = 'premium';
        }

        subscription = new Subscription({
          userId,
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId: stripeSub.customer,
          stripePriceId: priceId,
          productId: stripeSub.items.data[0].price.product,
          status: stripeSub.status,
          plan: {
            name: planType === 'pro' ? 'Studio' : planType === 'premium' ? 'Creator' : 'Basic',
            type: planType,
            price: {
              amount: stripeSub.items.data[0].price.unit_amount,
              currency: stripeSub.items.data[0].price.currency,
              interval: stripeSub.items.data[0].price.recurring.interval,
              intervalCount: stripeSub.items.data[0].price.recurring.interval_count
            },
            features: stripeService.getPlanFeatures(planType),
            limits: stripeService.getPlanLimits(planType)
          },
          billing: {
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end
          },
          usage: {
            imagesGenerated: 0,
            modelsGenerated: 0,
            storageUsed: 0,
            lastReset: new Date()
          }
        });

        await subscription.save();
        logger.info(`✅ Subscription synced from Stripe: ${subscription.id}`);
      }

      syncedSubscriptions.push(subscription);
    }

    // Update user with latest active subscription
    const activeSubscription = syncedSubscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSubscription) {
      const user = await User.findOne({ id: userId });
      if (user) {
        user.subscription = {
          type: activeSubscription.plan.type,
          expiresAt: activeSubscription.billing.currentPeriodEnd,
          features: activeSubscription.plan.features,
          stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
          status: activeSubscription.status
        };
        await user.save();
        logger.info(`✅ User subscription info updated for: ${userId}`);
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedSubscriptions.length} subscription(s)`,
      data: {
        subscriptions: syncedSubscriptions.map(sub => ({
          id: sub.id,
          plan: sub.plan.type,
          status: sub.status,
          currentPeriodEnd: sub.billing.currentPeriodEnd
        }))
      }
    });

  } catch (error) {
    logger.error('❌ Subscription sync error:', error);
    next(new AppError(error.message || 'Failed to sync subscription', 500));
  }
};

