# 🚀 Production Webhook Setup Guide

## ⚠️ CRITICAL: Your webhooks are NOT configured for production!

Your backend is running on **Railway** at `https://cudliydesign-production.up.railway.app`, but Stripe doesn't know where to send webhook events. That's why subscriptions aren't updating!

## ✅ Quick Fix (5 minutes)

### Step 1: Configure Stripe Webhook Endpoint

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Enter your webhook URL**:
   ```
   https://cudliydesign-production.up.railway.app/api/webhooks/stripe
   ```
4. **Select these events**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Click "Add endpoint"**

### Step 2: Copy Webhook Signing Secret

1. After creating the endpoint, click on it
2. **Copy the "Signing secret"** (starts with `whsec_...`)
3. **Add it to your Railway environment variables**:
   - Go to Railway Dashboard
   - Open your project
   - Go to **Variables** tab
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE`
   - **Deploy/Restart** your service

### Step 3: Test the Webhook

After setting up, test it:

1. **Check webhook health**:
   ```bash
   curl https://cudliydesign-production.up.railway.app/api/webhooks/health
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "message": "Webhook endpoint is healthy",
     "timestamp": "..."
   }
   ```

2. **Try a test subscription**:
   - Go to your pricing page
   - Click "Upgrade Now"
   - Complete payment with test card: `4242 4242 4242 4242`
   - Watch your Railway logs for webhook events!

### Step 4: Verify Webhook in Stripe

1. Go back to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. You should see **Recent events** appearing after each test payment
4. Click on an event to see:
   - ✅ Request sent successfully (200 OK)
   - Response from your server

## 🔍 Debugging

### Check Railway Logs

In your Railway dashboard, check the logs. After a successful payment, you should see:

```
🔔 Processing checkout session: cs_test_...
Session metadata: {"userId":"...","planType":"premium","interval":"month"}
✅ Found userId in metadata: ...
Stripe subscription retrieved: sub_...
✅ Subscription record created successfully
✅ User ... subscription updated to premium
✅ Subscription checkout completed successfully
```

### If You Don't See Webhook Logs:

1. **Verify webhook URL** in Stripe Dashboard is correct
2. **Check Railway deployment** is running (should show "Active")
3. **Verify STRIPE_WEBHOOK_SECRET** is set in Railway variables
4. **Check Stripe Dashboard** → Webhooks → Your endpoint → Recent events
   - If events show "Failed" - check the error message
   - If no events appear - webhook isn't being triggered

### Common Issues:

**Issue**: "No signature found in header"
- **Fix**: Webhook secret not configured correctly in Railway

**Issue**: "Webhook signature verification failed"
- **Fix**: Using wrong webhook secret (dev vs production)

**Issue**: No events in Stripe Dashboard
- **Fix**: Webhook URL is incorrect or endpoint doesn't exist

## 🎯 Current State

- ✅ Backend running: `https://cudliydesign-production.up.railway.app`
- ✅ Webhook endpoint: `/api/webhooks/stripe`
- ❌ Webhook NOT configured in Stripe Dashboard (this is the problem!)
- ❌ STRIPE_WEBHOOK_SECRET probably not set in Railway

## 📋 Checklist

Complete these steps:

- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] Copy signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Railway environment variables
- [ ] Restart Railway service
- [ ] Test webhook health endpoint
- [ ] Try a test subscription payment
- [ ] Verify logs show webhook processing
- [ ] Confirm subscription updates on dashboard

## 🚨 Quick Test (Right Now!)

**Without setting up webhooks**, you can manually verify the subscription was created:

1. Complete a payment
2. Note your User ID from the URL: `d1752474-74af-49bb-bd15-c34c1f3eabde`
3. Check Stripe Dashboard → Customers → Find your customer → Subscriptions
4. You should see an **active subscription** there
5. The issue is: **Your database doesn't know about it** because webhooks aren't configured!

## 🔧 Alternative: Trigger Webhook Manually

If you need immediate testing without webhook setup:

1. Go to Stripe Dashboard → Developers → Events
2. Find recent `checkout.session.completed` event
3. Click **"Send test webhook"**
4. Choose your webhook endpoint
5. Send it

This will manually trigger the webhook and update your database!

---

**Bottom line**: Your payment is working, but your server never receives the webhook event telling it to update the subscription. Fix this by configuring the webhook endpoint in Stripe Dashboard!

