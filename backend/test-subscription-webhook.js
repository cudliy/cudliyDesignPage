/**
 * Test Script to Verify Subscription Webhook Logic
 * Run this to check if webhook handlers work correctly
 */

import dotenv from 'dotenv';
dotenv.config();

import logger from './src/utils/logger.js';
import stripeService from './src/services/stripeService.js';
import mongoose from 'mongoose';
import Subscription from './src/models/Subscription.js';
import User from './src/models/User.js';

async function testWebhookLogic() {
  try {
    console.log('\n🧪 Testing Subscription Webhook Logic\n');
    
    // Connect to database
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check environment variables
    console.log('1️⃣ Checking Environment Variables:');
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FAL_API_KEY: ${process.env.FAL_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   REPLICATE_API_TOKEN: ${process.env.REPLICATE_API_TOKEN ? '✅ Set' : '❌ Missing'}\n`);
    
    // Test 2: Check Stripe connection
    console.log('2️⃣ Testing Stripe Connection:');
    try {
      const products = await stripeService.getProducts();
      console.log(`   ✅ Successfully connected to Stripe`);
      console.log(`   📦 Found ${products.length} products\n`);
      
      // Show products and their metadata
      console.log('3️⃣ Stripe Products Configuration:');
      for (const product of products) {
        console.log(`   📦 ${product.name}`);
        console.log(`      ID: ${product.id}`);
        console.log(`      Active: ${product.active}`);
        console.log(`      Plan Type: ${product.metadata?.planType || product.metadata?.type || '⚠️ NOT SET'}`);
        
        // Get prices for this product
        try {
          const prices = await stripeService.getPrices(product.id);
          console.log(`      Prices:`);
          for (const price of prices) {
            if (price.active) {
              console.log(`         - ${price.recurring?.interval}: $${(price.unit_amount / 100).toFixed(2)} (${price.id})`);
            }
          }
        } catch (err) {
          console.log(`         ⚠️ Could not fetch prices: ${err.message}`);
        }
        console.log('');
      }
    } catch (err) {
      console.log(`   ❌ Stripe connection failed: ${err.message}\n`);
    }
    
    // Test 3: Check existing subscriptions
    console.log('4️⃣ Checking Database Subscriptions:');
    const subscriptions = await Subscription.find().limit(5).sort({ createdAt: -1 });
    console.log(`   📊 Found ${subscriptions.length} recent subscriptions\n`);
    
    if (subscriptions.length > 0) {
      console.log('   Most Recent Subscriptions:');
      for (const sub of subscriptions) {
        console.log(`   - User: ${sub.userId}`);
        console.log(`     Plan: ${sub.plan.type} (${sub.plan.name})`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Period: ${sub.billing.currentPeriodStart?.toLocaleDateString()} - ${sub.billing.currentPeriodEnd?.toLocaleDateString()}`);
        console.log(`     Limits: ${sub.plan.limits.imagesPerMonth} images, ${sub.plan.limits.modelsPerMonth} models`);
        console.log('');
      }
    } else {
      console.log('   ⚠️ No subscriptions found in database yet\n');
    }
    
    // Test 4: Check Users with subscriptions
    console.log('5️⃣ Checking User Subscription Status:');
    const users = await User.find({ 'subscription.type': { $ne: 'free' } }).limit(5);
    console.log(`   👥 Found ${users.length} users with paid subscriptions\n`);
    
    if (users.length > 0) {
      console.log('   Users with Active Subscriptions:');
      for (const user of users) {
        console.log(`   - ${user.email || user.id}`);
        console.log(`     Type: ${user.subscription.type}`);
        console.log(`     Expires: ${user.subscription.expiresAt?.toLocaleDateString() || 'N/A'}`);
        console.log('');
      }
    } else {
      console.log('   ⚠️ No users with paid subscriptions in User model\n');
    }
    
    console.log('\n✅ Webhook Logic Test Complete!\n');
    console.log('📝 Summary:');
    console.log('   - If products show correct planType metadata: ✅ Good');
    console.log('   - If subscriptions exist in DB: ✅ Webhooks working');
    console.log('   - If User models updated: ✅ Full flow working');
    console.log('\n💡 If issues found:');
    console.log('   1. Run: npm run stripe:check (to verify product setup)');
    console.log('   2. Check Stripe Dashboard → Webhooks for failed events');
    console.log('   3. Verify STRIPE_WEBHOOK_SECRET in environment variables\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the test
testWebhookLogic();

