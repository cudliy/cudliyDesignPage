# Subscription Fix Verification Guide

## Changes Made

### 1. **User Model Enhancement**
- **File**: `backend/src/models/User.js`
- **Changes**:
  - Added `enterprise` to subscription type enum
  - Added `stripeSubscriptionId` and `status` fields to User.subscription
  - This ensures User model can store complete subscription data

### 2. **Webhook Handler Improvements**
- **File**: `backend/src/services/stripeService.js`
- **Changes**:
  - Enhanced `handleCheckoutSessionCompleted` to update User with full subscription data
  - Added fallback update method if primary update fails
  - Improved all webhook handlers (created, updated, invoice payment) to sync User data
  - Added comprehensive logging with emoji indicators for easy debugging
  - All User updates now use `runValidators: false` to prevent validation errors

### 3. **Usage Limits API Enhancement**
- **File**: `backend/src/controllers/paymentController.js`
- **Changes**:
  - `checkUsageLimits` now returns subscription info alongside limits
  - Better handling of free tier vs paid subscriptions
  - Returns complete subscription object for frontend display

### 4. **Frontend Polling Improvements**
- **File**: `src/pages/Dashboard.tsx`
- **Changes**:
  - Increased polling attempts from 10 to 15
  - Increased polling interval from 2s to 3s
  - Added dual check: both getUserSubscriptions AND checkUsageLimits
  - Better logging with emoji indicators
  - Added 2-second initial delay before polling starts
  - Enhanced error handling with retry logic

## How It Works Now

### Payment Flow:
1. **User clicks "Upgrade Now"**
   - Frontend calls `apiService.createSubscription(userId, planType, interval)`
   - Backend creates Stripe checkout session with metadata: `{userId, planType, interval}`

2. **User completes payment**
   - Stripe sends webhook: `checkout.session.completed`

3. **Webhook Processing** (handleCheckoutSessionCompleted):
   ```
   ✅ Extracts userId from session.metadata
   ✅ Retrieves Stripe subscription details
   ✅ Creates/Updates Subscription record in database
   ✅ Updates User.subscription with:
      - type (premium/pro/enterprise)
      - expiresAt (billing period end)
      - features (array of features)
      - stripeSubscriptionId
      - status (active/trialing)
   ```

4. **Frontend Detection**:
   ```
   🔔 Detects session_id in URL
   ⏳ Waits 2 seconds
   🔍 Polls every 3 seconds (up to 15 times):
      - Checks getUserSubscriptions API
      - Checks checkUsageLimits API
   ✅ When subscription found:
      - Refreshes usage limits
      - Removes session_id from URL
      - Reloads page with updated data
   ```

5. **Dashboard Update**:
   - Usage limits reflect new plan
   - Subscription status displayed
   - Features unlocked

## Testing Instructions

### Prerequisites
1. Ensure backend is running: `cd backend && npm run dev`
2. Ensure frontend is running: `cd .. && npm run dev`
3. Stripe webhook endpoint configured (use Stripe CLI for local testing)

### Test Stripe CLI Webhook Forwarding (Local Development)
```bash
# In a new terminal
stripe login
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe

# Copy the webhook signing secret (whsec_...) to your .env file
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Cases

#### Test 1: Creator Plan (Premium) - Monthly
1. Go to `/pricing`
2. Click "Upgrade Now" on Creator Plan (Monthly: $9.99)
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. **Expected Results**:
   - Redirects to `/dashboard?session_id=...`
   - Console shows: "🔔 Stripe checkout session detected"
   - Polling starts after 2 seconds
   - Within 15 attempts (45 seconds), subscription found
   - Page reloads
   - Dashboard shows:
     - Plan: Premium
     - Limits: 100 images/month, 50 models/month
     - Usage: 0/100 images, 0/50 models

#### Test 2: Studio Plan (Pro) - Yearly
1. Go to `/pricing`
2. Click "Upgrade Now" on Studio Plan (Yearly: $599.99)
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. **Expected Results**:
   - Same flow as Test 1
   - Dashboard shows:
     - Plan: Pro
     - Limits: 1000 images/month, 500 models/month
     - Usage: 0/1000 images, 0/500 models

#### Test 3: Promotional Pricing (First Month $4.99)
1. Go to `/pricing`
2. Click "Upgrade Now" on Creator Plan (Monthly)
3. **Expected Results**:
   - Checkout shows $4.99 for first month
   - Subsequent months: $9.99
   - Subscription activates successfully

### Verification Queries

#### 1. Check Subscription in Database
```javascript
// In MongoDB shell or Compass
db.subscriptions.find({ userId: "YOUR_USER_ID" }).sort({ createdAt: -1 }).limit(1)

// Should show:
{
  userId: "YOUR_USER_ID",
  status: "active",
  plan: {
    type: "premium" or "pro",
    limits: { imagesPerMonth: 100, modelsPerMonth: 50, ... }
  },
  billing: {
    currentPeriodEnd: [future date],
    ...
  }
}
```

#### 2. Check User Document
```javascript
db.users.findOne({ id: "YOUR_USER_ID" }, { subscription: 1 })

// Should show:
{
  subscription: {
    type: "premium" or "pro",
    expiresAt: [future date],
    features: [...],
    stripeSubscriptionId: "sub_...",
    status: "active"
  }
}
```

#### 3. Check Usage Limits API
```bash
curl http://localhost:3001/api/payments/users/YOUR_USER_ID/usage/limits \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
{
  "success": true,
  "data": {
    "plan": "premium",
    "subscription": {
      "id": "...",
      "status": "active",
      "currentPeriodEnd": "...",
      "planName": "Creator Plan"
    },
    "limits": {
      "imagesPerMonth": 100,
      "modelsPerMonth": 50,
      ...
    },
    "usage": {
      "imagesGenerated": 0,
      "modelsGenerated": 0,
      "storageUsed": 0
    },
    "remaining": {
      "images": 100,
      "models": 50
    }
  }
}
```

### Backend Logs to Monitor

**Successful Flow:**
```
Creating subscription checkout for user: [userId], plan: [planType], interval: [interval]
Customer retrieved/created: [customerId]
Found price ID: [priceId] for plan: [planType], interval: [interval]
Checkout session created: [sessionId] for user: [userId]
Metadata attached: {"userId":"...","planType":"...","interval":"..."}

[After payment]
🔔 Processing checkout session: [sessionId], mode: subscription
Session metadata: {"userId":"...","planType":"...","interval":"..."}
✅ Found userId in metadata: [userId]
Stripe subscription retrieved: [subscriptionId], status: active
📦 Product details - Name: ..., Plan Type: ...
💰 Price details - Amount: ... USD, Interval: month/year
✅ Subscription record created successfully with ID: [recordId]
Updating user [userId] with: {...}
✅ User [userId] subscription updated to [planType]
User subscription data: type=[planType], expires=[date], status=active
✅ Subscription checkout completed successfully: [sessionId]
```

**Frontend Logs:**
```
🔔 Stripe checkout session detected: cs_test_...
⏳ Starting subscription polling in 2 seconds...
🔍 Checking for subscription... (attempt 1/15)
📦 User subscriptions response: {...}
📊 Usage limits response: {...}
✅ Active subscription found!
🔄 Refreshing usage limits...
🔃 Reloading page with updated subscription...
```

## Common Issues & Solutions

### Issue 1: "No userId in session metadata"
**Cause**: Metadata not passed to Stripe checkout
**Solution**: Already fixed - metadata is now explicitly set in createSubscription

### Issue 2: User subscription not updating
**Cause**: User model validation or enum mismatch
**Solution**: Already fixed - added runValidators: false and updated enum

### Issue 3: Frontend keeps polling
**Cause**: Webhook not processing or subscription not marked active
**Solution**: 
- Check webhook secret is correct
- Check backend logs for errors
- Verify Stripe webhook endpoint is configured

### Issue 4: Limits not updating
**Cause**: Subscription created but limits API not returning correct data
**Solution**: Already fixed - checkUsageLimits now properly reads subscription

## Rollback Instructions

If issues persist, you can rollback changes:

```bash
# Revert User model
git checkout HEAD -- backend/src/models/User.js

# Revert webhook handler
git checkout HEAD -- backend/src/services/stripeService.js

# Revert payment controller
git checkout HEAD -- backend/src/controllers/paymentController.js

# Revert frontend
git checkout HEAD -- src/pages/Dashboard.tsx
```

## Support

If subscription updates are still not working:

1. **Check Backend Logs** - Look for emoji indicators (✅, ❌, 🔔, etc.)
2. **Check Database** - Verify Subscription and User documents
3. **Check Stripe Dashboard** - Verify webhook events are being sent
4. **Check Frontend Console** - Look for polling logs
5. **Test Webhook Manually**:
   ```bash
   stripe trigger checkout.session.completed
   ```

## Next Steps

After verifying subscriptions work:
1. Test subscription cancellation flow
2. Test subscription upgrade/downgrade
3. Test usage limit enforcement
4. Test subscription renewal (invoice.payment_succeeded)
5. Set up production webhook endpoint in Stripe Dashboard

