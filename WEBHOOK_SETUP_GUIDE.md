# Stripe Webhook Setup Guide

## 🚨 THE PROBLEM

From your console logs, I can see:
- ✅ Payment completes successfully in Stripe (session ID: `cs_test_a1MYi62ohGXNeghZyqxFtYUlvQrA3czo74VCwH4Bs6CynYz68HmMa9n44P`)
- ✅ Frontend polls backend for subscription
- ❌ Backend returns `plan: 'free'` and `subscription: null`
- ❌ No subscription created in your database

**Root Cause**: Your Stripe webhook is **NOT receiving** the `checkout.session.completed` event from Stripe, so the subscription is never created in your database.

## 🔧 SOLUTION 1: Configure Stripe Webhook (REQUIRED)

### Step 1: Get Your Webhook Endpoint URL
Your backend webhook endpoint is:
```
https://cudliydesign-production.up.railway.app/api/webhooks/stripe
```

### Step 2: Add Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard** → https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://cudliydesign-production.up.railway.app/api/webhooks/stripe`
4. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. **Click "Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_...`)

### Step 3: Add Webhook Secret to Railway

1. **Go to Railway Dashboard** → Your backend service
2. **Variables** tab
3. **Add new variable**:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (the signing secret from Step 2)
4. **Save and redeploy**

### Step 4: Test the Webhook

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click "Send test webhook"
3. Select `checkout.session.completed`
4. Click "Send test webhook"
5. Check if it shows "Success" ✅

## 🔧 SOLUTION 2: Manual Sync Endpoint (WORKAROUND)

I've created a manual sync endpoint that can pull subscription data directly from Stripe when webhook fails.

### How It Works:

After payment completes, the Dashboard will:
1. Poll for subscription for 1 minute
2. **NEW**: If not found, automatically trigger manual sync
3. Sync endpoint retrieves session from Stripe
4. Creates subscription in your database
5. Updates user subscription info

### Manual Sync via API (If Needed):

```bash
curl -X POST https://cudliydesign-production.up.railway.app/api/payments/sync-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "d1752474-74af-49bb-bd15-c34c1f3eabde",
    "sessionId": "cs_test_a1MYi62ohGXNeghZyqxFtYUlvQrA3czo74VCwH4Bs6CynYz68HmMa9n44P"
  }'
```

## 📊 Testing Checklist

After configuring webhook:

- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` added to Railway
- [ ] Backend redeployed
- [ ] Test webhook sent successfully in Stripe Dashboard
- [ ] Make a test subscription purchase
- [ ] Check console logs for subscription creation
- [ ] Verify plan updates in dashboard

## 🐛 Debugging

### Check Backend Logs in Railway:

1. Go to Railway → Your backend service → **Deployments**
2. Click on latest deployment → **View Logs**
3. Make a test purchase
4. Look for these log messages:
   ```
   🔔 Processing checkout session: cs_test_...
   ✅ Subscription created: [subscription-id]
   ✅ User subscription info updated
   ```

### If Webhook Not Receiving Events:

**Check Stripe Dashboard → Webhooks → Your endpoint:**
- Status should be "Enabled" ✅
- Recent deliveries should show events
- If showing errors, check:
  - Endpoint URL is correct
  - Railway backend is running
  - No firewall blocking requests
  - HTTPS is working

### If Webhook Secret Invalid:

**Error**: `No signatures found matching the expected signature for payload`

**Fix**:
1. Delete old webhook in Stripe Dashboard
2. Create new webhook
3. Copy NEW signing secret
4. Update `STRIPE_WEBHOOK_SECRET` in Railway
5. Redeploy

## 🎯 Current Status

### What's Working:
- ✅ Frontend properly sends payment requests
- ✅ Stripe checkout completes successfully  
- ✅ Frontend polls for subscription
- ✅ Manual sync endpoint created
- ✅ Zustand state management for subscriptions

### What's NOT Working:
- ❌ Stripe webhook not configured/receiving events
- ❌ Subscriptions not being created in database
- ❌ Plan not updating after payment

### Next Steps:
1. **IMMEDIATE**: Configure Stripe webhook (Solution 1 above)
2. **TEST**: Make a test purchase and verify webhook receives event
3. **MONITOR**: Check Railway logs for subscription creation
4. **VERIFY**: Confirm plan updates in dashboard

## 🔑 Environment Variables Needed

Ensure these are set in Railway:

```bash
# Stripe (REQUIRED)
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # ← THIS IS MISSING!

# Database
MONGODB_URI=mongodb+srv://...

# Other
FRONTEND_URL=https://cudliy-design-page.vercel.app
JWT_SECRET=...
NODE_ENV=production
```

## 📝 Additional Notes

### For Production (Live Mode):

1. Create SEPARATE webhook for live mode in Stripe
2. Use live webhook URL (same as test but for live dashboard)
3. Get SEPARATE signing secret for live mode
4. Update Railway with live secret OR use separate env var

### Testing in Development:

Use Stripe CLI to forward webhooks to localhost:

```bash
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
```

This will give you a temporary webhook secret starting with `whsec_...`

## 🆘 If Still Not Working

1. **Share Railway backend logs** (during a test purchase)
2. **Share Stripe webhook delivery logs** (Dashboard → Webhooks → Your endpoint → Recent deliveries)
3. **Verify these:**
   - Webhook endpoint URL is exactly: `https://cudliydesign-production.up.railway.app/api/webhooks/stripe`
   - `STRIPE_WEBHOOK_SECRET` is set in Railway
   - Backend is deployed and running
   - Test mode using test secret, live mode using live secret

---

**Summary**: Your webhook is not configured in Stripe Dashboard. Add it with the endpoint URL above, copy the signing secret to Railway's `STRIPE_WEBHOOK_SECRET`, and redeploy. Then test with a new purchase.

