#!/usr/bin/env node

/**
 * Script to block the specific violation reported by the user
 * Request ID: ab6bde80-4439-468a-a41f-1dd212b3169f
 * Runner ID: 0390daf3-b546-4738-b7e7-f3f4cbfdd919
 * Endpoint: fal-ai/flux-2-lora-gallery/hdr-style
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import requestTracker from '../src/utils/requestTracker.js';
import logger from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

async function blockReportedViolation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Block the specific request ID from the screenshot
    await requestTracker.blockRequestId(
      'ab6bde80-4439-468a-a41f-1dd212b3169f',
      'Reported inappropriate content generation - nude images',
      'user_report'
    );

    // Flag the runner ID
    await requestTracker.flagRunnerId(
      '0390daf3-b546-4738-b7e7-f3f4cbfdd919',
      'Associated with inappropriate content generation',
      'user_report'
    );

    // Block the problematic endpoint
    await requestTracker.blockEndpoint(
      'fal-ai/flux-2-lora-gallery/hdr-style',
      'Used for generating inappropriate content - bypasses content filtering',
      'user_report'
    );

    logger.info('✅ Successfully blocked reported violation:');
    logger.info('   - Request ID: ab6bde80-4439-468a-a41f-1dd212b3169f');
    logger.info('   - Runner ID: 0390daf3-b546-4738-b7e7-f3f4cbfdd919');
    logger.info('   - Endpoint: fal-ai/flux-2-lora-gallery/hdr-style');

    // Get current block lists for verification
    const blockLists = requestTracker.getBlockLists();
    logger.info('📊 Current block list status:');
    logger.info(`   - Blocked Request IDs: ${blockLists.blockedRequestIds.length}`);
    logger.info(`   - Suspicious Runner IDs: ${blockLists.suspiciousRunnerIds.length}`);
    logger.info(`   - Blocked Endpoints: ${blockLists.blockedEndpoints.length}`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error blocking reported violation:', error);
    process.exit(1);
  }
}

// Run the script
blockReportedViolation();