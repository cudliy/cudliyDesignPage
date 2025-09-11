# 🏦 Stripe Integration Setup Guide

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Product IDs (Create these in your Stripe dashboard)
STRIPE_PREMIUM_PRICE_ID=price_premium_monthly
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

Create these products in your Stripe Dashboard:

#### Free Plan
- **Name**: Cudliy Free
- **Description**: Basic AI generation with limited usage
- **Type**: Service
- **No price** (free tier)

#### Premium Plan
- **Name**: Cudliy Premium
- **Description**: Advanced AI generation with unlimited designs
- **Type**: Service
- **Price**: $9.99/month (recurring)
- **Price ID**: Copy this to `STRIPE_PREMIUM_PRICE_ID`

#### Pro Plan
- **Name**: Cudliy Pro
- **Description**: Professional features with API access
- **Type**: Service
- **Price**: $29.99/month (recurring)
- **Price ID**: Copy this to `STRIPE_PRO_PRICE_ID`

#### Enterprise Plan
- **Name**: Cudliy Enterprise
- **Description**: Enterprise features with dedicated support
- **Type**: Service
- **Price**: $99.99/month (recurring)
- **Price ID**: Copy this to `STRIPE_ENTERPRISE_PRICE_ID`

### 2. Configure Webhooks

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET`

### 3. Test Mode vs Live Mode

- **Test Mode**: Use `sk_test_` and `pk_test_` keys for development
- **Live Mode**: Use `sk_live_` and `pk_live_` keys for production

## API Endpoints

### Customer Management
- `POST /api/payments/customers` - Create customer
- `GET /api/payments/customers/:userId` - Get customer
- `PATCH /api/payments/customers/:userId` - Update customer

### Payment Methods
- `POST /api/payments/customers/:userId/payment-methods` - Create payment method
- `GET /api/payments/customers/:userId/payment-methods` - Get payment methods
- `POST /api/payments/customers/:userId/payment-methods/:paymentMethodId/default` - Set default

### Payment Intents
- `POST /api/payments/payment-intents` - Create payment intent
- `POST /api/payments/payment-intents/:paymentIntentId/confirm` - Confirm payment
- `GET /api/payments/payment-intents/:paymentIntentId` - Get payment intent

### Subscriptions
- `POST /api/payments/subscriptions` - Create subscription
- `GET /api/payments/subscriptions/:subscriptionId` - Get subscription
- `GET /api/payments/users/:userId/subscriptions` - Get user subscriptions
- `PATCH /api/payments/subscriptions/:subscriptionId` - Update subscription
- `DELETE /api/payments/subscriptions/:subscriptionId` - Cancel subscription

### Products and Pricing
- `GET /api/payments/products` - Get all products
- `GET /api/payments/products/:productId/prices` - Get product prices

### Usage and History
- `GET /api/payments/users/:userId/payments` - Get payment history
- `POST /api/payments/users/:userId/usage/track` - Track usage
- `GET /api/payments/users/:userId/usage/limits` - Check usage limits
- `POST /api/payments/refunds` - Create refund

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

## Usage Tracking Integration

The system automatically tracks usage and enforces limits:

### Free Plan Limits
- 3 images per month
- 1 model per month

### Premium Plan Limits
- 100 images per month
- 50 models per month

### Pro Plan Limits
- 1000 images per month
- 500 models per month

### Enterprise Plan Limits
- Unlimited images and models

## Testing

Use Stripe's test cards for testing:

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

## Security Notes

1. **Never expose secret keys** in frontend code
2. **Use HTTPS** in production
3. **Verify webhook signatures** (already implemented)
4. **Rate limiting** is applied to all payment endpoints
5. **Input validation** is enforced on all endpoints

## Error Handling

All payment errors are properly handled and logged:
- Stripe API errors are caught and converted to user-friendly messages
- Failed payments are tracked in the database
- Webhook failures are logged for debugging
