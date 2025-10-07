# 🔧 Subscription Update Fix Guide

## Problem
Subscriptions weren't being created/updated after Stripe checkout because:
1. ❌ Backend webhook handler wasn't creating Subscription records properly
2. ❌ Dashboard wasn't polling for subscription updates after payment
3. ❌ No retry logic for delayed webhooks

## ✅ Changes Made

### Backend Fixes (`backend/src/services/stripeService.js`)
1. **Fixed `handleCheckoutSessionCompleted`** - Now properly creates Subscription records for both plans
   - Detects subscription vs one-time payments
   - Retrieves full subscription details from Stripe
   - Creates/updates Subscription record in database
   - Updates User model with subscription type and expiration

2. **Enhanced `handleSubscriptionCreated`** - Creates subscription if webhook arrives before checkout.session.completed

3. **Improved `handleSubscriptionUpdated`** - Now updates User model when subscription changes

4. **Enhanced `handleInvoicePaymentSucceeded`** - Updates billing period and User model on recurring payments

### Frontend Fixes (`src/pages/Dashboard.tsx`)
1. **Added Stripe session detection** - Detects `session_id` URL parameter
2. **Added polling mechanism** - Retries up to 10 times (20 seconds) for subscription creation
3. **Auto-refresh** - Reloads dashboard when subscription is confirmed

### AI Service Fix (`backend/src/services/aiService.js`)
1. **Removed hardcoded fallback API key** - Now requires environment variables
2. **Added validation logging** - Shows if API keys are configured correctly

---

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes
```bash
# In your project root
git add .
git commit -m "Fix subscription creation and webhook handling for both Creator and Studio plans"
git push origin main
```

### Step 2: Verify Railway Environment Variables

#### Required Variables in Railway Dashboard:
1. **STRIPE_WEBHOOK_SECRET** ⚠️ **CRITICAL**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Find your Railway webhook endpoint (should be: `https://cudliydesign-production.up.railway.app/api/payments/webhook`)
   - Copy the "Signing secret" (starts with `whsec_`)
   - Set in Railway as `STRIPE_WEBHOOK_SECRET`

2. **FAL_API_KEY** 
   - Get from fal.ai dashboard
   - Format: `<key-id>:<secret>`
   - Set in Railway environment variables

3. **REPLICATE_API_TOKEN**
   - Get from Replicate dashboard
   - Format: `r8_...`
   - Set in Railway environment variables

4. **FRONTEND_URL**
   - Should be: `https://cudliy-design-page.vercel.app` (or your actual frontend URL)

### Step 3: Configure Stripe Webhook Events

In Stripe Dashboard → Webhooks → Select your webhook → Events to send:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 4: Test the Flow

#### Test Subscription Purchase:
1. Go to your pricing page as an authenticated user
2. Click "Upgrade" on Creator Plan or Studio Plan
3. Complete checkout with test card: `4242 4242 4242 4242`
4. You should be redirected to `/dashboard?session_id=XXX`
5. **Watch Browser Console** - You should see:
   ```
   Stripe checkout session detected: cs_test_...
   Checking for subscription... (attempt 1/10)
   ✅ Active subscription found!
   ```

#### Check Backend Logs in Railway:
You should see:
```
FAL_API_KEY configured successfully
REPLICATE_API_TOKEN configured successfully
Processing checkout session: cs_test_..., mode: subscription
Creating subscription for user: xxx, plan: premium
Subscription record created: xxx
User xxx subscription updated to premium
```

---

## 🔍 Debugging

### If Subscription Still Not Created:

1. **Check Railway Backend Logs**
   ```bash
   # Look for errors in webhook processing
   # Search for: "Handle Checkout Session Completed Error"
   ```

2. **Check Stripe Dashboard**
   - Go to Developers → Webhooks → [Your webhook]
   - Click on recent events
   - Look for `checkout.session.completed` events
   - Check if they succeeded or failed

3. **Test Webhook Directly in Stripe**
   - Go to Developers → Webhooks
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Check Railway logs for processing

4. **Verify Stripe Product Metadata**
   ```bash
   # In backend directory
   npm run stripe:check
   ```
   - Ensure products have `planType` metadata set correctly
   - Creator Plan should have: `planType: "premium"`
   - Studio Plan should have: `planType: "pro"`

### Common Issues:

**Issue:** "No active subscription found after 10 attempts"
- **Cause:** Webhook not configured or failing
- **Fix:** Check STRIPE_WEBHOOK_SECRET is set correctly in Railway

**Issue:** Subscription created but limits not updating
- **Cause:** User model not updated
- **Fix:** Check backend logs for "User xxx subscription updated" message

**Issue:** 3D model generation still failing
- **Cause:** API keys not loaded
- **Fix:** Redeploy backend after setting FAL_API_KEY and REPLICATE_API_TOKEN in Railway

---

## 📊 Verification Checklist

After deployment, verify:
- [ ] Railway shows FAL_API_KEY and REPLICATE_API_TOKEN configured
- [ ] Stripe webhook is receiving events (check Stripe Dashboard)
- [ ] Test subscription purchase completes successfully
- [ ] Dashboard shows updated subscription limits
- [ ] 3D model generation works
- [ ] Both monthly and yearly subscriptions work
- [ ] Both Creator Plan and Studio Plan work

---

## 🆘 Emergency Rollback

If something breaks:
```bash
git revert HEAD
git push origin main
```

---

## 📝 Next Steps (Future Improvements)

1. Add success toast notification when subscription is activated
2. Add loading spinner while polling for subscription
3. Add manual "Refresh Subscription" button
4. Add subscription expiration email notifications
5. Add subscription renewal reminders

---

**Need Help?** Check Railway logs and Stripe webhook logs first. The detailed logging will show exactly where the issue is occurring.

