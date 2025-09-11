import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import Checkout from '../models/Checkout.js';
import Order from '../models/Order.js';
import Design from '../models/Design.js';
import stripeService from '../services/stripeService.js';

// Create Stripe Checkout Session
export const createStripeCheckout = async (req, res, next) => {
  try {
    const { userId, designId, quantity = 1 } = req.body;

    // Get design details or create a placeholder if not found
    let design = await Design.findOne({ id: designId });
    if (!design) {
      // Create a placeholder design for testing
      design = new Design({
        id: designId,
        userId: userId || 'user-123',
        creationId: `creation-${Date.now()}`,
        originalText: 'Sample 3D Toy Design',
        userSelections: {
          color: 'blue',
          size: 'M',
          style: 'playful',
          material: 'plastic',
          production: 'digital'
        },
        generatedImages: [{
          url: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=Sample+3D+Toy',
          prompt: 'Sample 3D Toy Design',
          index: 0
        }],
        generated3DModel: {
          url: 'https://via.placeholder.com/512x512/10B981/FFFFFF?text=3D+Model',
          prompt: 'Sample 3D Model',
          format: 'obj'
        },
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await design.save();
      logger.info(`Created placeholder design for checkout: ${designId}`);
    }

    // Calculate pricing
    const unitPrice = 24.00; // Base price for 3D toys
    const subtotal = unitPrice * quantity;
    const tax = subtotal * 0.08; // 8% tax
    const shipping = 5.99; // Standard shipping
    const total = subtotal + tax + shipping;

    // Get or create customer
    let customer;
    try {
      customer = await stripeService.getCustomer(userId);
    } catch (error) {
      logger.error('Customer creation failed:', error);
      if (error.message.includes('Stripe is not configured')) {
        return next(new AppError('Payment service is not configured. Please contact support.', 503));
      }
      throw error;
    }

    // Create line items for Stripe Checkout
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: design.originalText || 'Custom 3D Design',
            description: `3D printed toy - ${design.userSelections?.color || 'blue'} ${design.userSelections?.style || 'playful'} design`,
            images: [design.generatedImages?.[0]?.url || design.images?.[0]?.url || 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=Sample+3D+Toy']
          },
          unit_amount: Math.round(unitPrice * 100) // Convert to cents
        },
        quantity: quantity
      },
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: 'Sales tax'
          },
          unit_amount: Math.round(tax * 100)
        },
        quantity: 1
      },
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping'
          },
          unit_amount: Math.round(shipping * 100)
        },
        quantity: 1
      }
    ];

    // Create Stripe Checkout Session
    const frontendUrl = process.env.FRONTEND_URL || 'https://cudliy-design-page.vercel.app';
    let session;
    try {
      session = await stripeService.createCheckoutSession(
        lineItems,
        customer.id,
        `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        `${frontendUrl}/checkout/${designId}?cancelled=true`,
        {
          userId,
          designId,
          quantity: quantity.toString()
        }
      );
    } catch (error) {
      logger.error('Stripe checkout session creation failed:', error);
      if (error.message.includes('Stripe is not configured')) {
        return next(new AppError('Payment service is not configured. Please contact support.', 503));
      }
      throw error;
    }

    // Save checkout session to database
    const checkout = new Checkout({
      userId,
      designId,
      sessionId: session.id,
      status: 'pending',
      items: [{
        designId: design.id,
        designTitle: design.originalText || 'Custom 3D Design',
        designImage: design.generatedImages?.[0]?.url || design.images?.[0]?.url || '',
        quantity,
        unitPrice,
        totalPrice: subtotal
      }],
      pricing: {
        subtotal,
        tax,
        shipping,
        total,
        currency: 'USD'
      }
    });

    await checkout.save();

    res.json({
      success: true,
      data: {
        checkoutId: checkout.id,
        sessionId: session.id,
        url: session.url,
        pricing: checkout.pricing,
        items: checkout.items
      }
    });
  } catch (error) {
    logger.error('Create Stripe Checkout Error:', error);
    
    // Handle specific error types
    if (error.message?.includes('STRIPE_SECRET_KEY')) {
      return next(new AppError('Payment service configuration error', 503));
    }
    
    if (error.message?.includes('customer')) {
      return next(new AppError('Unable to process customer information', 400));
    }
    
    if (error.message?.includes('session')) {
      return next(new AppError('Unable to create payment session', 500));
    }
    
    next(new AppError(error.message || 'Failed to create checkout session', 500));
  }
};

// Create checkout session (legacy - for custom checkout flow)
export const createCheckout = async (req, res, next) => {
  try {
    const { userId, designId, quantity = 1 } = req.body;

    // Get design details or create a placeholder if not found
    let design = await Design.findOne({ id: designId });
    if (!design) {
      // Create a placeholder design for testing
      design = new Design({
        id: designId,
        userId: userId || 'user-123',
        creationId: `creation-${Date.now()}`,
        originalText: 'Sample 3D Toy Design',
        userSelections: {
          color: 'blue',
          size: 'M',
          style: 'playful',
          material: 'plastic',
          production: 'digital'
        },
        generatedImages: [{
          url: 'https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=Sample+3D+Toy',
          prompt: 'Sample 3D Toy Design',
          index: 0
        }],
        generated3DModel: {
          url: 'https://via.placeholder.com/512x512/10B981/FFFFFF?text=3D+Model',
          prompt: 'Sample 3D Model',
          format: 'obj'
        },
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await design.save();
      logger.info(`Created placeholder design for checkout: ${designId}`);
    }

    // Calculate pricing
    const unitPrice = 24.00; // Base price for 3D toys
    const subtotal = unitPrice * quantity;
    const tax = subtotal * 0.08; // 8% tax
    const shipping = 5.99; // Standard shipping
    const total = subtotal + tax + shipping;

    // Create checkout session
    const checkout = new Checkout({
      userId,
      designId,
      sessionId: uuidv4(),
      status: 'draft',
      items: [{
        designId: design.id,
        designTitle: design.originalText || 'Custom 3D Design',
        designImage: design.generatedImages?.[0]?.url || design.images?.[0]?.url || '',
        quantity,
        unitPrice,
        totalPrice: subtotal
      }],
      pricing: {
        subtotal,
        tax,
        shipping,
        total,
        currency: 'USD'
      }
    });

    await checkout.save();

    res.json({
      success: true,
      data: {
        checkoutId: checkout.id,
        sessionId: checkout.sessionId,
        pricing: checkout.pricing,
        items: checkout.items
      }
    });
  } catch (error) {
    logger.error('Create Checkout Error:', error);
    next(new AppError(error.message || 'Failed to create checkout', 500));
  }
};

// Update checkout shipping info
export const updateShippingInfo = async (req, res, next) => {
  try {
    const { checkoutId } = req.params;
    const shippingInfo = req.body;
    
    logger.info('Update shipping info request:', { checkoutId, shippingInfo });

    const checkout = await Checkout.findOne({ id: checkoutId });
    if (!checkout) {
      return next(new AppError('Checkout session not found', 404));
    }

    checkout.shipping = shippingInfo;
    checkout.status = 'shipping_info';
    await checkout.save();

    res.json({
      success: true,
      data: checkout
    });
  } catch (error) {
    logger.error('Update Shipping Info Error:', error);
    next(new AppError('Failed to update shipping information', 500));
  }
};

// Update checkout billing info
export const updateBillingInfo = async (req, res, next) => {
  try {
    const { checkoutId } = req.params;
    const billingInfo = req.body;

    const checkout = await Checkout.findOne({ id: checkoutId });
    if (!checkout) {
      return next(new AppError('Checkout session not found', 404));
    }

    checkout.billing = billingInfo;
    checkout.status = 'billing_info';
    await checkout.save();

    res.json({
      success: true,
      data: checkout
    });
  } catch (error) {
    logger.error('Update Billing Info Error:', error);
    next(new AppError('Failed to update billing information', 500));
  }
};

// Create payment intent
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { checkoutId } = req.params;

    const checkout = await Checkout.findOne({ id: checkoutId });
    if (!checkout) {
      return next(new AppError('Checkout session not found', 404));
    }

    // Get or create customer
    const customer = await stripeService.getCustomer(checkout.userId);

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      checkout.pricing.total,
      checkout.pricing.currency,
      customer.id,
      {
        userId: checkout.userId,
        checkoutId: checkout.id,
        designId: checkout.designId
      }
    );

    // Update checkout with payment info
    checkout.payment = {
      method: 'card',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    };
    checkout.status = 'payment_info';
    await checkout.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    logger.error('Create Payment Intent Error:', error);
    next(new AppError('Failed to create payment intent', 500));
  }
};

// Complete checkout and create order
export const completeCheckout = async (req, res, next) => {
  try {
    const { checkoutId } = req.params;
    const { paymentIntentId } = req.body;

    const checkout = await Checkout.findOne({ id: checkoutId });
    if (!checkout) {
      return next(new AppError('Checkout session not found', 404));
    }

    // Verify payment intent
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return next(new AppError('Payment not completed', 400));
    }

    // Create order
    const order = new Order({
      userId: checkout.userId,
      designId: checkout.designId,
      stripePaymentIntentId: paymentIntentId,
      items: checkout.items,
      pricing: checkout.pricing,
      shipping: checkout.shipping,
      billing: checkout.billing,
      payment: {
        method: checkout.payment.method,
        status: 'paid',
        transactionId: paymentIntentId,
        paidAt: new Date()
      },
      status: 'paid'
    });

    await order.save();

    // Update checkout status
    checkout.status = 'completed';
    await checkout.save();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.pricing.total,
        estimatedDelivery: order.production.estimatedCompletion
      }
    });
  } catch (error) {
    logger.error('Complete Checkout Error:', error);
    next(new AppError('Failed to complete checkout', 500));
  }
};

// Get checkout session
export const getCheckout = async (req, res, next) => {
  try {
    const { checkoutId } = req.params;

    const checkout = await Checkout.findOne({ id: checkoutId });
    if (!checkout) {
      return next(new AppError('Checkout session not found', 404));
    }

    res.json({
      success: true,
      data: checkout
    });
  } catch (error) {
    logger.error('Get Checkout Error:', error);
    next(new AppError('Failed to get checkout session', 500));
  }
};

// Get user orders
export const getUserOrders = async (req, res, next) => {
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

    const orders = await Order.find(filter, null, options);
    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get User Orders Error:', error);
    next(new AppError('Failed to get user orders', 500));
  }
};

// Get order details
export const getOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get Order Error:', error);
    next(new AppError('Failed to get order details', 500));
  }
};

// Handle Stripe Checkout Session completion
export const handleCheckoutSessionCompleted = async (session) => {
  try {
    const { userId, designId, quantity } = session.metadata;
    
    // Find the checkout session
    const checkout = await Checkout.findOne({ sessionId: session.id });
    if (!checkout) {
      logger.error(`Checkout session not found: ${session.id}`);
      return;
    }

    // Create order
    const order = new Order({
      userId,
      designId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      items: checkout.items,
      pricing: checkout.pricing,
      shipping: {
        firstName: session.shipping_details?.name?.split(' ')[0] || '',
        lastName: session.shipping_details?.name?.split(' ').slice(1).join(' ') || '',
        email: session.customer_details?.email || '',
        phone: session.customer_details?.phone || '',
        address: {
          line1: session.shipping_details?.address?.line1 || '',
          line2: session.shipping_details?.address?.line2 || '',
          city: session.shipping_details?.address?.city || '',
          state: session.shipping_details?.address?.state || '',
          postalCode: session.shipping_details?.address?.postal_code || '',
          country: session.shipping_details?.address?.country || ''
        },
        method: 'standard'
      },
      billing: {
        firstName: session.customer_details?.name?.split(' ')[0] || '',
        lastName: session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
        email: session.customer_details?.email || '',
        address: {
          line1: session.customer_details?.address?.line1 || '',
          line2: session.customer_details?.address?.line2 || '',
          city: session.customer_details?.address?.city || '',
          state: session.customer_details?.address?.state || '',
          postalCode: session.customer_details?.address?.postal_code || '',
          country: session.customer_details?.address?.country || ''
        },
        sameAsShipping: true
      },
      payment: {
        method: 'card',
        status: 'paid',
        transactionId: session.payment_intent,
        paidAt: new Date()
      },
      status: 'paid'
    });

    await order.save();

    // Update checkout status
    checkout.status = 'completed';
    await checkout.save();

    logger.info(`Order created successfully: ${order.id} for session: ${session.id}`);
  } catch (error) {
    logger.error('Handle Checkout Session Completed Error:', error);
  }
};
