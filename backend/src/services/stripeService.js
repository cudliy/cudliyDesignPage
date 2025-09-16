import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();
import logger from '../utils/logger.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not found, Stripe functionality will be limited');
      this.stripe = null;
      this.webhookSecret = null;
    } else {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: true
      });
      this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }
  }

  // Customer Management
  async createCustomer(userId, email, name, metadata = {}) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          ...metadata
        }
      });

      // Save to database
      const customerRecord = new Customer({
        userId,
        stripeCustomerId: customer.id,
        email: customer.email,
        name: customer.name,
        metadata
      });
      await customerRecord.save();

      logger.info(`Customer created: ${customer.id} for user: ${userId}`);
      return customer;
    } catch (error) {
      logger.error('Create Customer Error:', error);
      throw error;
    }
  }

  async getCustomer(userId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
      let customerRecord = await Customer.findOne({ userId });
      
      if (!customerRecord) {
        const user = await User.findOne({ id: userId });
        if (!user) {
          throw new Error('User not found');
        }
        
        // Ensure user has required fields for customer creation
        const email = user.email || `guest-${userId}@temp.com`;
        const name = user.profile?.firstName 
          ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
          : user.username || `Guest User ${userId}`;
        
        logger.info(`Creating Stripe customer for user ${userId}: ${email}, ${name}`);
        
        const customer = await this.createCustomer(
          userId, 
          email, 
          name
        );
        return customer;
      }

      // Sync with Stripe
      const customer = await this.stripe.customers.retrieve(customerRecord.stripeCustomerId);
      return customer;
    } catch (error) {
      logger.error('Get Customer Error:', error);
      logger.error('Error details:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async updateCustomer(userId, updates) {
    try {
      const customerRecord = await Customer.findOne({ userId });
      if (!customerRecord) {
        throw new Error('Customer not found');
      }

      const customer = await this.stripe.customers.update(customerRecord.stripeCustomerId, updates);
      
      // Update local record
      await Customer.findOneAndUpdate(
        { userId },
        { 
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          ...updates
        }
      );

      return customer;
    } catch (error) {
      logger.error('Update Customer Error:', error);
      throw error;
    }
  }

  // Payment Methods
  async createPaymentMethod(type, card, customerId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type,
        card,
        customer: customerId
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Create Payment Method Error:', error);
      throw error;
    }
  }

  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );

      return paymentMethod;
    } catch (error) {
      logger.error('Attach Payment Method Error:', error);
      throw error;
    }
  }

  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Get Payment Methods Error:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(customerId, paymentMethodId) {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return customer;
    } catch (error) {
      logger.error('Set Default Payment Method Error:', error);
      throw error;
    }
  }

  // Checkout Sessions
  async createCheckoutSession(lineItems, customerId, successUrl, cancelUrl, metadata = {}) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU']
        },
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto'
        }
      });

      return session;
    } catch (error) {
      logger.error('Create Checkout Session Error:', error);
      throw error;
    }
  }

  async getCheckoutSession(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      logger.error('Get Checkout Session Error:', error);
      throw error;
    }
  }

  // Payment Intents
  async createPaymentIntent(amount, currency, customerId, metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Save to database
      const paymentRecord = new Payment({
        userId: metadata.userId,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId,
        amount,
        currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        metadata
      });
      await paymentRecord.save();

      return paymentIntent;
    } catch (error) {
      logger.error('Create Payment Intent Error:', error);
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        { payment_method: paymentMethodId }
      );

      // Update database
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
          status: paymentIntent.status,
          paymentMethod: {
            type: paymentIntent.payment_method?.type,
            last4: paymentIntent.payment_method?.card?.last4,
            brand: paymentIntent.payment_method?.card?.brand,
            expMonth: paymentIntent.payment_method?.card?.exp_month,
            expYear: paymentIntent.payment_method?.card?.exp_year
          }
        }
      );

      return paymentIntent;
    } catch (error) {
      logger.error('Confirm Payment Intent Error:', error);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Get Payment Intent Error:', error);
      throw error;
    }
  }

  // Subscriptions
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      // Get product details
      const price = await this.stripe.prices.retrieve(priceId);
      const product = await this.stripe.products.retrieve(price.product);

      // Save to database
      const subscriptionRecord = new Subscription({
        userId: metadata.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        productId: product.id,
        status: subscription.status,
        plan: {
          name: product.name,
          type: this.getPlanType(product.metadata?.type || 'premium'),
          price: {
            amount: price.unit_amount / 100,
            currency: price.currency,
            interval: price.recurring?.interval,
            intervalCount: price.recurring?.interval_count || 1
          },
          features: this.getPlanFeatures(product.metadata?.type || 'premium'),
          limits: this.getPlanLimits(product.metadata?.type || 'premium')
        },
        billing: {
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        }
      });
      await subscriptionRecord.save();

      // Update user subscription
      await User.findOneAndUpdate(
        { id: metadata.userId },
        {
          'subscription.type': subscriptionRecord.plan.type,
          'subscription.expiresAt': subscriptionRecord.billing.currentPeriodEnd,
          'subscription.features': subscriptionRecord.plan.features
        }
      );

      return subscription;
    } catch (error) {
      logger.error('Create Subscription Error:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Get Subscription Error:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId, reason = 'user_requested') {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: { cancelation_reason: reason }
      });

      // Update database
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          status: subscription.status,
          'billing.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          'billing.canceledAt': new Date(),
          'billing.cancelationReason': reason
        }
      );

      return subscription;
    } catch (error) {
      logger.error('Cancel Subscription Error:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);
      
      // Update database
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          status: subscription.status,
          'billing.cancelAtPeriodEnd': subscription.cancel_at_period_end
        }
      );

      return subscription;
    } catch (error) {
      logger.error('Update Subscription Error:', error);
      throw error;
    }
  }

  // Products and Prices
  async getProducts(active = true) {
    try {
      const products = await this.stripe.products.list({
        active,
        expand: ['data.default_price']
      });

      return products.data;
    } catch (error) {
      logger.error('Get Products Error:', error);
      throw error;
    }
  }

  async getPrices(productId) {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true
      });

      return prices.data;
    } catch (error) {
      logger.error('Get Prices Error:', error);
      throw error;
    }
  }

  // Webhooks
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info(`Webhook received: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook Error:', error);
      throw error;
    }
  }

  // Webhook Handlers
  async handleCheckoutSessionCompleted(session) {
    try {
      // Import the handler function dynamically to avoid circular imports
      const { handleCheckoutSessionCompleted } = await import('../controllers/checkoutController.js');
      await handleCheckoutSessionCompleted(session);
      logger.info(`Checkout session completed: ${session.id}`);
    } catch (error) {
      logger.error('Handle Checkout Session Completed Error:', error);
    }
  }

  async handlePaymentSucceeded(paymentIntent) {
    try {
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'succeeded',
          receipt: {
            url: paymentIntent.charges?.data[0]?.receipt_url,
            email: paymentIntent.charges?.data[0]?.receipt_email
          }
        }
      );

      logger.info(`Payment succeeded: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Handle Payment Succeeded Error:', error);
    }
  }

  async handlePaymentFailed(paymentIntent) {
    try {
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message,
          failureCode: paymentIntent.last_payment_error?.code
        }
      );

      logger.info(`Payment failed: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Handle Payment Failed Error:', error);
    }
  }

  async handleSubscriptionCreated(subscription) {
    try {
      // Update subscription status
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: subscription.status }
      );

      logger.info(`Subscription created: ${subscription.id}`);
    } catch (error) {
      logger.error('Handle Subscription Created Error:', error);
    }
  }

  async handleSubscriptionUpdated(subscription) {
    try {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          status: subscription.status,
          'billing.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          'billing.canceledAt': subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
        }
      );

      logger.info(`Subscription updated: ${subscription.id}`);
    } catch (error) {
      logger.error('Handle Subscription Updated Error:', error);
    }
  }

  async handleSubscriptionDeleted(subscription) {
    try {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          status: 'canceled',
          'billing.canceledAt': new Date()
        }
      );

      // Update user subscription to free
      const subscriptionRecord = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
      if (subscriptionRecord) {
        await User.findOneAndUpdate(
          { id: subscriptionRecord.userId },
          {
            'subscription.type': 'free',
            'subscription.expiresAt': null,
            'subscription.features': []
          }
        );
      }

      logger.info(`Subscription deleted: ${subscription.id}`);
    } catch (error) {
      logger.error('Handle Subscription Deleted Error:', error);
    }
  }

  async handleInvoicePaymentSucceeded(invoice) {
    try {
      // Update subscription status
      if (invoice.subscription) {
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { status: 'active' }
        );
      }

      logger.info(`Invoice payment succeeded: ${invoice.id}`);
    } catch (error) {
      logger.error('Handle Invoice Payment Succeeded Error:', error);
    }
  }

  async handleInvoicePaymentFailed(invoice) {
    try {
      // Update subscription status
      if (invoice.subscription) {
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { status: 'past_due' }
        );
      }

      logger.info(`Invoice payment failed: ${invoice.id}`);
    } catch (error) {
      logger.error('Handle Invoice Payment Failed Error:', error);
    }
  }

  // Helper Methods
  getPlanType(type) {
    const planTypes = {
      'free': 'free',
      'premium': 'premium',
      'pro': 'pro',
      'enterprise': 'enterprise'
    };
    return planTypes[type] || 'premium';
  }

  getPlanFeatures(type) {
    const features = {
      'free': ['Basic AI generation', '3 designs per month', 'Community support'],
      'premium': ['Advanced AI generation', 'Unlimited designs', 'Priority support', 'High-res exports'],
      'pro': ['All Premium features', 'API access', 'Custom branding', 'Team collaboration'],
      'enterprise': ['All Pro features', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
    };
    return features[type] || features['premium'];
  }

  getPlanLimits(type) {
    const limits = {
      'free': {
        imagesPerMonth: 3,
        modelsPerMonth: 1,
        storageGB: 1,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        teamMembers: 1
      },
      'premium': {
        imagesPerMonth: 100,
        modelsPerMonth: 50,
        storageGB: 10,
        prioritySupport: true,
        customBranding: false,
        apiAccess: false,
        teamMembers: 1
      },
      'pro': {
        imagesPerMonth: 1000,
        modelsPerMonth: 500,
        storageGB: 100,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        teamMembers: 5
      },
      'enterprise': {
        imagesPerMonth: -1, // unlimited
        modelsPerMonth: -1, // unlimited
        storageGB: 1000,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        teamMembers: -1 // unlimited
      }
    };
    return limits[type] || limits['premium'];
  }

  // Refunds
  async createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason
      });

      // Update payment record
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
          $push: {
            refunds: {
              id: refund.id,
              amount: refund.amount / 100,
              reason: refund.reason,
              status: refund.status,
              createdAt: new Date()
            }
          }
        }
      );

      return refund;
    } catch (error) {
      logger.error('Create Refund Error:', error);
      throw error;
    }
  }
}

export default new StripeService();
