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

async function checkSubscriptions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active subscriptions
    const subscriptions = await Subscription.find({
      status: { $in: ['active', 'trialing'] }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${subscriptions.length} active subscriptions\n`);

    if (subscriptions.length === 0) {
      console.log('ℹ️  No active subscriptions found');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Display each subscription
    subscriptions.forEach((sub, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Subscription #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`User ID: ${sub.userId}`);
      console.log(`Plan: ${sub.plan.name} (${sub.plan.type})`);
      console.log(`Status: ${sub.status}`);
      console.log(`\n💳 Limits:`);
      console.log(`  Images per month: ${sub.plan.limits.imagesPerMonth}`);
      console.log(`  Models per month: ${sub.plan.limits.modelsPerMonth}`);
      console.log(`\n📈 Current Usage:`);
      console.log(`  Images generated: ${sub.usage?.imagesGenerated || 0}`);
      console.log(`  Models generated: ${sub.usage?.modelsGenerated || 0}`);
      console.log(`  Storage used: ${sub.usage?.storageUsed || 0} bytes`);
      console.log(`  Last reset: ${sub.usage?.lastReset || 'Never'}`);
      console.log(`\n📊 Remaining:`);
      const remainingImages = sub.plan.limits.imagesPerMonth === -1 
        ? '∞' 
        : sub.plan.limits.imagesPerMonth - (sub.usage?.imagesGenerated || 0);
      const remainingModels = sub.plan.limits.modelsPerMonth === -1 
        ? '∞' 
        : sub.plan.limits.modelsPerMonth - (sub.usage?.modelsGenerated || 0);
      console.log(`  Images remaining: ${remainingImages}`);
      console.log(`  Models remaining: ${remainingModels}`);
      console.log(`\n⏰ Billing Period:`);
      console.log(`  Current period ends: ${sub.billing.currentPeriodEnd}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary by plan type
    console.log('📊 Summary by Plan Type:');
    const planSummary = {};
    subscriptions.forEach(sub => {
      const planType = sub.plan.type;
      if (!planSummary[planType]) {
        planSummary[planType] = {
          count: 0,
          totalImages: 0,
          totalModels: 0
        };
      }
      planSummary[planType].count++;
      planSummary[planType].totalImages += sub.usage?.imagesGenerated || 0;
      planSummary[planType].totalModels += sub.usage?.modelsGenerated || 0;
    });

    Object.keys(planSummary).forEach(planType => {
      const summary = planSummary[planType];
      console.log(`\n  ${planType.toUpperCase()}:`);
      console.log(`    Active subscriptions: ${summary.count}`);
      console.log(`    Total images generated: ${summary.totalImages}`);
      console.log(`    Total models generated: ${summary.totalModels}`);
    });

    console.log('\n✅ Check complete!');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking subscriptions:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the check
checkSubscriptions();

