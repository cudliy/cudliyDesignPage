import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import Subscription model
import Subscription from './src/models/Subscription.js';

async function fixSubscriptionUsage() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all subscriptions without usage field or with null usage
    const subscriptionsToFix = await Subscription.find({
      $or: [
        { usage: { $exists: false } },
        { usage: null },
        { 'usage.imagesGenerated': { $exists: false } },
        { 'usage.modelsGenerated': { $exists: false } }
      ]
    });

    console.log(`\n📊 Found ${subscriptionsToFix.length} subscriptions to fix`);

    if (subscriptionsToFix.length === 0) {
      console.log('✅ All subscriptions already have usage tracking initialized!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Display subscriptions to be fixed
    console.log('\n📋 Subscriptions to fix:');
    subscriptionsToFix.forEach((sub, index) => {
      console.log(`${index + 1}. Plan: ${sub.plan.name} (${sub.plan.type}) - User: ${sub.userId}`);
      console.log(`   Current usage: ${JSON.stringify(sub.usage)}`);
    });

    // Update all subscriptions
    console.log('\n🔧 Updating subscriptions...');
    
    const result = await Subscription.updateMany(
      {
        $or: [
          { usage: { $exists: false } },
          { usage: null },
          { 'usage.imagesGenerated': { $exists: false } },
          { 'usage.modelsGenerated': { $exists: false } }
        ]
      },
      {
        $set: {
          usage: {
            imagesGenerated: 0,
            modelsGenerated: 0,
            storageUsed: 0,
            lastReset: new Date()
          }
        }
      }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} subscriptions!`);

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const stillBroken = await Subscription.find({
      $or: [
        { usage: { $exists: false } },
        { usage: null }
      ]
    });

    if (stillBroken.length === 0) {
      console.log('✅ All subscriptions now have usage tracking initialized!');
    } else {
      console.log(`⚠️  Warning: ${stillBroken.length} subscriptions still need fixing`);
    }

    // Show sample of fixed subscriptions
    console.log('\n📊 Sample of fixed subscriptions:');
    const fixed = await Subscription.find({
      usage: { $exists: true }
    }).limit(5);

    fixed.forEach((sub, index) => {
      console.log(`${index + 1}. Plan: ${sub.plan.name} (${sub.plan.type})`);
      console.log(`   Usage: Images=${sub.usage.imagesGenerated}, Models=${sub.usage.modelsGenerated}`);
      console.log(`   Limits: Images=${sub.plan.limits.imagesPerMonth}, Models=${sub.plan.limits.modelsPerMonth}`);
    });

    console.log('\n✨ Done! All subscriptions have been fixed.');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the fix
fixSubscriptionUsage();

