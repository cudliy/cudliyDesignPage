# Subscription Payment Troubleshooting Guide

## Issues Fixed

### 1. **CRITICAL: Webhook Middleware Order**
**Problem:** Stripe webhooks require raw body data to verify signatures, but the global JSON parsing middleware was processing the body before webhooks could access it.

**Solution:** Moved webhook route registration BEFORE body parsing middleware in `server.js`.

**Location:** `backend/src/server.js` lines 110-112

### 2. **Enhanced Logging**
Added comprehensive logging throughout the subscription creation and webhook handling process to track:
- User ID propagation through checkout
- Subscription metadata
- Database record creation/updates
- User profile updates

### 3. **Metadata Propagation**
Ensured that `userId`, `planType`, and `interval` are properly passed through:
1. Frontend → Backend API
2. Backend → Stripe Checkout Session
3. Stripe Webhook → Database

## Testing the Payment Flow

### Prerequisites
1. **Environment Variables** - Verify these are set:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=http://localhost:5174 (or your frontend URL)
   MONGODB_URI=mongodb://...
   ```

2. **Stripe Products** - Ensure you have products configured:
   - Creator Plan (planType: 'premium')
     - Monthly price
     - Yearly price
   - Studio Plan (planType: 'pro')
     - Monthly price
     - Yearly price

### Testing Steps

#### Step 1: Create Subscription Checkout
1. User clicks "Upgrade Now" on PricingPage
2. Check backend logs for:
   ```
   Creating subscription checkout for user: [userId], plan: [planType], interval: [interval]
   Customer retrieved/created: [customerId]
   Found price ID: [priceId] for plan: [planType], interval: [interval]
   Checkout session created: [sessionId] for user: [userId]
   ```

#### Step 2: Complete Payment in Stripe
1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC

#### Step 3: Webhook Processing
After successful payment, check backend logs for:
```
🔔 Processing checkout session: [sessionId], mode: subscription
Session metadata: {"userId":"...","planType":"...","interval":"..."}
✅ Found userId in metadata: [userId]
Stripe subscription retrieved: [subscriptionId], status: active
📦 Product details - Name: ..., Plan Type: ...
💰 Price details - Amount: ... USD, Interval: month/year
✅ Subscription record created successfully with ID: [recordId]
✅ User [userId] subscription updated to [planType]
✅ Subscription checkout completed successfully
```

#### Step 4: Verify Database Updates
1. **Check Subscriptions Collection:**
   ```javascript
   db.subscriptions.find({ userId: "[userId]" })
   ```
   Should show:
   - `status: "active"`
   - `plan.type: "premium"` or `"pro"`
   - `billing.currentPeriodEnd` set correctly

2. **Check Users Collection:**
   ```javascript
   db.users.find({ id: "[userId]" })
   ```
   Should show:
   - `subscription.type: "premium"` or `"pro"`
   - `subscription.expiresAt` set correctly
   - `subscription.features` populated

#### Step 5: Frontend Verification
1. Dashboard should detect `session_id` in URL
2. Polls for subscription (up to 10 times, 2 seconds apart)
3. Once found, reloads page
4. Usage limits should update to show new plan limits

## Common Issues & Solutions

### Issue 1: Webhook Not Receiving Events
**Symptoms:**
- Payment succeeds in Stripe
- No webhook logs in backend
- Subscription not created in database

**Solutions:**
1. Verify webhook endpoint is accessible:
   ```bash
   curl https://your-backend.com/api/webhooks/health
   ```

2. Check Stripe webhook configuration:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Verify endpoint URL: `https://your-backend.com/api/webhooks/stripe`
   - Verify events are enabled:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `invoice.payment_succeeded`

3. Check STRIPE_WEBHOOK_SECRET:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```

### Issue 2: "No userId in session metadata"
**Symptoms:**
- Webhook receives event
- Error log: "❌ CRITICAL: No userId in session metadata"

**Solutions:**
1. Verify checkout session creation includes metadata:
   ```javascript
   metadata: {
     userId,
     planType,
     interval
   }
   ```

2. Check frontend is sending userId in API request:
   ```javascript
   apiService.createSubscription(userId, planType, interval)
   ```

### Issue 3: Subscription Created but User Not Updated
**Symptoms:**
- Subscription record exists in database
- User's subscription.type still shows "free"

**Solutions:**
1. Check if user exists with exact ID:
   ```javascript
   db.users.find({ id: "[userId]" })
   ```

2. Verify User model has subscription field
3. Check logs for: "❌ Failed to update user [userId] - user not found"

### Issue 4: Frontend Not Detecting Subscription
**Symptoms:**
- Subscription created successfully
- Dashboard keeps polling
- Shows "No active subscription found after 10 attempts"

**Solutions:**
1. Verify getUserSubscriptions API endpoint works:
   ```bash
   curl http://localhost:3001/api/payments/users/[userId]/subscriptions
   ```

2. Check subscription status is "active" or "trialing"
3. Verify frontend polling logic (Dashboard.tsx lines 136-186)

## Webhook Event Flow

```
1. User completes payment in Stripe Checkout
   ↓
2. Stripe sends webhook event: checkout.session.completed
   ↓
3. Backend receives raw body at /api/webhooks/stripe
   ↓
4. Verify signature using STRIPE_WEBHOOK_SECRET
   ↓
5. Extract userId from session.metadata
   ↓
6. Retrieve subscription details from Stripe
   ↓
7. Create/Update Subscription record in database
   ↓
8. Update User.subscription fields
   ↓
9. Frontend polls and detects new subscription
   ↓
10. Page reloads with updated limits
```

## Environment-Specific Notes

### Development (Local)
- Use Stripe CLI to forward webhooks:
  ```bash
  stripe listen --forward-to localhost:3001/api/webhooks/stripe
  ```
- Copy webhook signing secret to `.env`:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### Production
- Configure webhook endpoint in Stripe Dashboard
- Use production webhook secret
- Ensure backend URL is publicly accessible
- Check firewall/security group settings

## Monitoring & Logs

### Key Log Messages to Monitor

**Success:**
- ✅ Subscription record created successfully
- ✅ User [userId] subscription updated to [planType]
- ✅ Subscription checkout completed successfully

**Warnings:**
- Subscription already exists, updating
- User not found when updating subscription

**Errors:**
- ❌ CRITICAL: No userId in session metadata
- ❌ Failed to update user
- ❌ Handle Checkout Session Completed Error

### Database Queries for Monitoring

1. **Recent subscriptions:**
   ```javascript
   db.subscriptions.find().sort({ createdAt: -1 }).limit(10)
   ```

2. **Active subscriptions count:**
   ```javascript
   db.subscriptions.countDocuments({ status: "active" })
   ```

3. **Users with premium plans:**
   ```javascript
   db.users.find({ "subscription.type": { $in: ["premium", "pro"] } }).count()
   ```

## Support Contact
If issues persist after following this guide:
1. Check backend logs for error messages
2. Verify all environment variables
3. Test webhook endpoint manually
4. Contact support with:
   - Session ID
   - User ID
   - Timestamp of payment
   - Error logs

