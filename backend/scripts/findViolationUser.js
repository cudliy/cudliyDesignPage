#!/usr/bin/env node

/**
 * Script to find the user who made the inappropriate request
 * Request ID: ab6bde80-4439-468a-a41f-1dd212b3169f
 * Date: December 12th, 2025 at 5:53:42 AM GMT+1
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Design from '../src/models/Design.js';
import User from '../src/models/User.js';
import Session from '../src/models/Session.js';
import ContentViolation from '../src/models/ContentViolation.js';
import logger from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

async function findViolationUser() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      console.log('📝 This script needs database access to search for the user');
      console.log('🔍 Manual investigation needed:');
      console.log('   1. Check server logs for requests around December 12th, 2025 at 5:53:42 AM GMT+1');
      console.log('   2. Look for fal-ai/flux-2-lora-gallery/hdr-style endpoint calls');
      console.log('   3. Check for requests with ~29 second duration');
      console.log('   4. Cross-reference with user activity logs');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Search parameters based on the violation
    const violationDate = new Date('2025-12-12T04:53:42.000Z'); // 5:53:42 AM GMT+1 = 4:53:42 UTC
    const searchStart = new Date(violationDate.getTime() - 5 * 60 * 1000); // 5 minutes before
    const searchEnd = new Date(violationDate.getTime() + 5 * 60 * 1000); // 5 minutes after

    console.log('🔍 Searching for violation user...');
    console.log(`📅 Time window: ${searchStart.toISOString()} to ${searchEnd.toISOString()}`);

    // 1. Search for designs created around that time
    console.log('\n1️⃣ Searching designs around violation time...');
    const suspiciousDesigns = await Design.find({
      createdAt: {
        $gte: searchStart,
        $lte: searchEnd
      }
    }).sort({ createdAt: 1 });

    console.log(`   Found ${suspiciousDesigns.length} designs in time window`);
    
    for (const design of suspiciousDesigns) {
      console.log(`   📋 Design ID: ${design.id}`);
      console.log(`   👤 User ID: ${design.userId}`);
      console.log(`   📝 Prompt: ${design.originalText?.substring(0, 100)}...`);
      console.log(`   ⏰ Created: ${design.createdAt.toISOString()}`);
      console.log(`   🎯 Status: ${design.status}`);
      console.log('   ─────────────────────────────────────');
    }

    // 2. Search for sessions around that time
    console.log('\n2️⃣ Searching sessions around violation time...');
    const suspiciousSessions = await Session.find({
      createdAt: {
        $gte: searchStart,
        $lte: searchEnd
      }
    }).sort({ createdAt: 1 });

    console.log(`   Found ${suspiciousSessions.length} sessions in time window`);
    
    for (const session of suspiciousSessions) {
      console.log(`   🔗 Session ID: ${session.id}`);
      console.log(`   👤 User ID: ${session.userId}`);
      console.log(`   📝 Original Text: ${session.originalText?.substring(0, 100)}...`);
      console.log(`   ⏰ Created: ${session.createdAt.toISOString()}`);
      console.log(`   📊 Step: ${session.currentStep}`);
      console.log('   ─────────────────────────────────────');
    }

    // 3. Search for any existing content violations
    console.log('\n3️⃣ Searching existing content violations...');
    const violations = await ContentViolation.find({
      createdAt: {
        $gte: searchStart,
        $lte: searchEnd
      }
    }).sort({ createdAt: 1 });

    console.log(`   Found ${violations.length} violations in time window`);
    
    for (const violation of violations) {
      console.log(`   🚨 Violation ID: ${violation._id}`);
      console.log(`   👤 User ID: ${violation.userId}`);
      console.log(`   📝 Content: ${violation.content?.substring(0, 100)}...`);
      console.log(`   ⚠️  Severity: ${violation.severity}`);
      console.log(`   🎯 Action: ${violation.action}`);
      console.log(`   ⏰ Created: ${violation.createdAt.toISOString()}`);
      console.log('   ─────────────────────────────────────');
    }

    // 4. Search for users with suspicious patterns
    console.log('\n4️⃣ Searching for users with suspicious activity patterns...');
    
    // Look for users who might have generated inappropriate content
    const suspiciousPrompts = [
      'nude', 'naked', 'topless', 'explicit', 'sexual', 'erotic',
      'revealing', 'provocative', 'seductive', 'intimate'
    ];

    const suspiciousDesignsByContent = await Design.find({
      $or: suspiciousPrompts.map(term => ({
        originalText: { $regex: term, $options: 'i' }
      }))
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`   Found ${suspiciousDesignsByContent.length} designs with suspicious content`);
    
    for (const design of suspiciousDesignsByContent) {
      console.log(`   🚨 Suspicious Design ID: ${design.id}`);
      console.log(`   👤 User ID: ${design.userId}`);
      console.log(`   📝 Prompt: ${design.originalText?.substring(0, 100)}...`);
      console.log(`   ⏰ Created: ${design.createdAt.toISOString()}`);
      console.log('   ─────────────────────────────────────');
    }

    // 5. Get user details for identified suspicious users
    console.log('\n5️⃣ Getting user details for suspicious accounts...');
    
    const allSuspiciousUserIds = [
      ...suspiciousDesigns.map(d => d.userId),
      ...suspiciousSessions.map(s => s.userId),
      ...violations.map(v => v.userId),
      ...suspiciousDesignsByContent.map(d => d.userId)
    ];

    const uniqueUserIds = [...new Set(allSuspiciousUserIds)];
    console.log(`   Investigating ${uniqueUserIds.length} unique users`);

    for (const userId of uniqueUserIds) {
      // Skip guest users for now
      if (userId.startsWith('guest_')) {
        console.log(`   👻 Guest User: ${userId} (no account details)`);
        continue;
      }

      const user = await User.findOne({ 
        $or: [
          { id: userId },
          { _id: userId }
        ]
      });

      if (user) {
        console.log(`   👤 REGISTERED USER FOUND:`);
        console.log(`      🆔 User ID: ${user.id}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      👤 Username: ${user.username}`);
        console.log(`      📝 Name: ${user.profile?.firstName} ${user.profile?.lastName}`);
        console.log(`      📅 Joined: ${user.createdAt?.toISOString()}`);
        console.log(`      🔗 Google Auth: ${user.googleAuth?.email || 'No'}`);
        console.log(`      🍎 Apple Auth: ${user.appleAuth?.email || 'No'}`);
        console.log(`      📊 Subscription: ${user.subscription?.type || 'free'}`);
        console.log(`      🎨 Images Generated: ${user.usage?.imagesGenerated || 0}`);
        console.log(`      🎯 Models Generated: ${user.usage?.modelsGenerated || 0}`);
        console.log('      ═════════════════════════════════════');
      } else {
        console.log(`   👻 User ID: ${userId} (not found in database - likely guest)`);
      }
    }

    // 6. Summary and recommendations
    console.log('\n📊 INVESTIGATION SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (uniqueUserIds.length === 0) {
      console.log('❌ No users found in the violation time window');
      console.log('💡 This suggests the violation may have occurred:');
      console.log('   - Through a different system/API');
      console.log('   - By a guest user not tracked in our database');
      console.log('   - Outside our application entirely');
    } else {
      console.log(`✅ Found ${uniqueUserIds.length} potentially related users`);
      
      const registeredUsers = [];
      const guestUsers = [];
      
      for (const userId of uniqueUserIds) {
        if (userId.startsWith('guest_')) {
          guestUsers.push(userId);
        } else {
          const user = await User.findOne({ 
            $or: [{ id: userId }, { _id: userId }]
          });
          if (user) {
            registeredUsers.push(user);
          }
        }
      }
      
      console.log(`👤 Registered users: ${registeredUsers.length}`);
      console.log(`👻 Guest users: ${guestUsers.length}`);
      
      if (registeredUsers.length > 0) {
        console.log('\n🚨 REGISTERED USERS TO INVESTIGATE:');
        for (const user of registeredUsers) {
          console.log(`   📧 ${user.email} (${user.username})`);
        }
      }
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Review server logs for the exact time: December 12th, 2025 at 5:53:42 AM GMT+1');
    console.log('2. Check for any fal-ai API calls with the request ID: ab6bde80-4439-468a-a41f-1dd212b3169f');
    console.log('3. If registered users found, consider account restrictions');
    console.log('4. Implement additional monitoring for similar patterns');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during user investigation:', error);
    console.log('\n💡 Manual investigation steps:');
    console.log('1. Check application logs for December 12th, 2025 around 5:53 AM');
    console.log('2. Look for API calls to fal-ai endpoints');
    console.log('3. Check user activity logs and session data');
    console.log('4. Review any stored request/response data');
    process.exit(1);
  }
}

// Run the investigation
findViolationUser();