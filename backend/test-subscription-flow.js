/**
 * Subscription Flow Test Script
 * 
 * This script tests the complete subscription flow including:
 * 1. Creating a subscription checkout
 * 2. Simulating webhook processing
 * 3. Verifying database updates
 * 4. Checking usage limits
 * 
 * Usage: node test-subscription-flow.js <userId>
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/models/User.js';
import Subscription from './src/models/Subscription.js';
import Customer from './src/models/Customer.js';
import stripeService from './src/services/stripeService.js';
import logger from './src/utils/logger.js';

const TEST_USER_ID = process.argv[2];

if (!TEST_USER_ID) {
  console.error('❌ Please provide a userId: node test-subscription-flow.js <userId>');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testSubscriptionFlow() {
  console.log('\n🧪 Testing Subscription Flow for User:', TEST_USER_ID);
  console.log('='.repeat(60));

  // Step 1: Find or create user
  console.log('\n📋 Step 1: Checking user...');
  let user = await User.findOne({ id: TEST_USER_ID });
  
  if (!user) {
    console.log('❌ User not found. Please provide a valid userId.');
    return;
  }
  
  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    currentSubscription: user.subscription
  });

  // Step 2: Check existing subscriptions
  console.log('\n📋 Step 2: Checking existing subscriptions...');
  const existingSubscriptions = await Subscription.find({ userId: TEST_USER_ID });
  console.log(`Found ${existingSubscriptions.length} existing subscriptions`);
  
  if (existingSubscriptions.length > 0) {
    console.log('Existing subscriptions:');
    existingSubscriptions.forEach((sub, i) => {
      console.log(`  ${i + 1}. Status: ${sub.status}, Plan: ${sub.plan.type}, ID: ${sub.stripeSubscriptionId}`);
    });
  }

  // Step 3: Get or create Stripe customer
  console.log('\n📋 Step 3: Getting/Creating Stripe customer...');
  const customer = await stripeService.getCustomer(TEST_USER_ID);
  console.log('✅ Stripe customer:', customer.id);

  // Step 4: Get available products
  console.log('\n📋 Step 4: Listing available subscription plans...');
  const products = await stripeService.getProducts();
  
  console.log('Available plans:');
  for (const product of products) {
    if (product.metadata?.planType) {
      const prices = await stripeService.getPrices(product.id);
      console.log(`\n  📦 ${product.name} (${product.metadata.planType})`);
      prices.forEach(price => {
        if (price.active) {
          const amount = (price.unit_amount / 100).toFixed(2);
          console.log(`    💰 ${amount} ${price.currency.toUpperCase()} / ${price.recurring?.interval}`);
          console.log(`       Price ID: ${price.id}`);
        }
      });
    }
  }

  // Step 5: Test checkout session creation
  console.log('\n📋 Step 5: Testing checkout session creation...');
  console.log('Creating checkout for Creator Plan (premium) - Monthly');
  
  try {
    // Find premium plan price
    let targetPriceId = null;
    for (const product of products) {
      if (product.metadata?.planType === 'premium') {
        const prices = await stripeService.getPrices(product.id);
        const monthlyPrice = prices.find(p => p.recurring?.interval === 'month' && p.active);
        if (monthlyPrice) {
          targetPriceId = monthlyPrice.id;
          break;
        }
      }
    }

    if (!targetPriceId) {
      console.log('⚠️ No premium monthly price found. Skipping checkout test.');
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const checkoutSession = await stripeService.createCheckoutSession({
        customerId: customer.id,
        priceId: targetPriceId,
        mode: 'subscription',
        successUrl: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${frontendUrl}/pricing`,
        metadata: {
          userId: TEST_USER_ID,
          planType: 'premium',
          interval: 'month'
        }
      });

      console.log('✅ Checkout session created!');
      console.log('   Session ID:', checkoutSession.id);
      console.log('   Checkout URL:', checkoutSession.url);
      console.log('\n🔗 To complete payment, visit:');
      console.log('   ' + checkoutSession.url);
      console.log('\n💡 Use test card: 4242 4242 4242 4242');
    }
  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message);
  }

  // Step 6: Check usage limits
  console.log('\n📋 Step 6: Checking current usage limits...');
  const activeSubscription = await Subscription.findOne({ 
    userId: TEST_USER_ID, 
    status: { $in: ['active', 'trialing'] } 
  }).sort({ createdAt: -1 });

  if (activeSubscription) {
    console.log('✅ Active subscription found:');
    console.log('   Plan:', activeSubscription.plan.type);
    console.log('   Status:', activeSubscription.status);
    console.log('   Limits:', {
      images: activeSubscription.plan.limits.imagesPerMonth,
      models: activeSubscription.plan.limits.modelsPerMonth
    });
    console.log('   Usage:', {
      images: activeSubscription.usage.imagesGenerated,
      models: activeSubscription.usage.modelsGenerated
    });
    console.log('   Remaining:', {
      images: activeSubscription.plan.limits.imagesPerMonth === -1 ? 'Unlimited' : 
        (activeSubscription.plan.limits.imagesPerMonth - activeSubscription.usage.imagesGenerated),
      models: activeSubscription.plan.limits.modelsPerMonth === -1 ? 'Unlimited' :
        (activeSubscription.plan.limits.modelsPerMonth - activeSubscription.usage.modelsGenerated)
    });
    console.log('   Period End:', activeSubscription.billing.currentPeriodEnd);
  } else {
    console.log('ℹ️ No active subscription (Free tier)');
    console.log('   Limits: 3 images/month, 1 model/month');
    console.log('   Usage:', {
      images: user.usage.imagesGenerated || 0,
      models: user.usage.modelsGenerated || 0
    });
  }

  // Step 7: Verify User model sync
  console.log('\n📋 Step 7: Verifying User model sync...');
  user = await User.findOne({ id: TEST_USER_ID });
  console.log('User.subscription:', user.subscription);
  
  if (activeSubscription) {
    const isSynced = 
      user.subscription.type === activeSubscription.plan.type &&
      user.subscription.stripeSubscriptionId === activeSubscription.stripeSubscriptionId &&
      user.subscription.status === activeSubscription.status;
    
    if (isSynced) {
      console.log('✅ User model is synced with Subscription record');
    } else {
      console.log('⚠️ User model is NOT synced with Subscription record');
      console.log('   User.subscription.type:', user.subscription.type);
      console.log('   Subscription.plan.type:', activeSubscription.plan.type);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!\n');
}

async function main() {
  await connectDB();
  await testSubscriptionFlow();
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

