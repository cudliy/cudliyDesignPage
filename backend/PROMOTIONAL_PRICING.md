# Creator Plan Promotional Pricing

## Overview
The Creator Plan offers promotional pricing for new subscribers:
- **First Month**: $9.99
- **Following Months**: $14.99/month

This is implemented using Stripe coupons that automatically apply a $5.00 discount to the first month's invoice.

---

## Implementation Details

### Stripe Coupon Configuration
- **Coupon ID**: `CREATOR_FIRST_MONTH`
- **Discount Amount**: $5.00 off
- **Currency**: USD
- **Duration**: `once` (applies only to first invoice)
- **Applicable Plans**: Creator Plan (premium) monthly subscriptions only

### Automatic Application
The promotional coupon is automatically applied when:
1. User selects Creator Plan
2. User selects monthly billing (not yearly)
3. User creates a new subscription via Stripe Checkout

The coupon is **NOT** applied for:
- Yearly billing (already discounted)
- Studio Plan subscriptions
- Free tier users

---

## Setup Instructions

### 1. Create the Promotional Coupon in Stripe

Run the setup script:
```bash
cd backend
npm run stripe:setup-promo
```

This will:
- Check if the coupon already exists
- Create `CREATOR_FIRST_MONTH` coupon with $5.00 off
- Configure it to apply once (first invoice only)
- Add metadata for tracking

### 2. Verify Coupon Creation

You can verify the coupon in:
- **Stripe Dashboard**: Products → Coupons
- **Or run the check script**:
  ```bash
  npm run stripe:check
  ```

### 3. Test the Flow

1. Go to the pricing page
2. Select Creator Plan with monthly billing
3. Click "Upgrade Now"
4. In Stripe Checkout, verify the discount is applied:
   - Subtotal: $14.99
   - Discount (CREATOR_FIRST_MONTH): -$5.00
   - **Total due today**: $9.99
5. Complete the test payment
6. Verify next invoice will be $14.99

---

## Code Changes

### Frontend (`src/pages/PricingPage.tsx`)
```typescript
{
  name: "Creator Plan",
  price: isYearly ? "$12.99" : "$9.99",
  period: isYearly ? "/month billed yearly ($155.88/year)" : "/1st month then $14.99/month",
  // ...
}
```

### Backend (`backend/src/services/stripeService.js`)
```javascript
// Apply promotional coupon for Creator Plan monthly subscriptions
if (options.metadata?.planType === 'premium' && options.metadata?.interval === 'month') {
  sessionConfig.discounts = [{
    coupon: 'CREATOR_FIRST_MONTH'
  }];
  logger.info('Applying promotional coupon CREATOR_FIRST_MONTH');
}
```

---

## Stripe Dashboard Configuration

### Creating the Coupon Manually (Alternative)

If you prefer to create it manually in Stripe Dashboard:

1. Go to **Products → Coupons**
2. Click **"+ New"**
3. Configure:
   - **Coupon ID**: `CREATOR_FIRST_MONTH` (must match exactly)
   - **Type**: Fixed amount
   - **Amount off**: $5.00
   - **Currency**: USD
   - **Duration**: Once
   - **Name**: Creator Plan - First Month Discount
4. Click **"Create coupon"**

---

## Customer Experience

### Checkout Flow
1. User selects Creator Plan (monthly)
2. Redirected to Stripe Checkout
3. Checkout shows:
   ```
   Creator Plan                           $14.99
   First Month Discount (CREATOR_FIRST_MONTH)  -$5.00
   ─────────────────────────────────────────────
   Total due today                         $9.99
   ```
4. After payment, subscription is created at $14.99/month
5. First invoice: $9.99 (with discount)
6. Second invoice onwards: $14.99

### Email Confirmation
Customers receive:
- Receipt for $9.99 (first month)
- Confirmation that next billing will be $14.99/month
- Subscription details showing recurring price

---

## Monitoring & Analytics

### Track Promotional Usage

Check coupon redemptions in Stripe Dashboard:
```
Products → Coupons → CREATOR_FIRST_MONTH → View redemptions
```

### Useful Metrics
- Total redemptions
- Total discount amount given
- Conversion rate (free → Creator Plan)
- Retention rate after first month

---

## Troubleshooting

### Coupon Not Applying
1. Check coupon exists: `npm run stripe:check`
2. Verify coupon ID is exactly `CREATOR_FIRST_MONTH`
3. Check backend logs for discount application
4. Ensure user selected monthly billing (not yearly)

### Wrong Discount Amount
1. Verify coupon amount is 500 cents ($5.00)
2. Check currency is USD
3. Confirm duration is "once"

### Discount Applying to Wrong Plans
1. Check the conditional logic in `stripeService.js`
2. Ensure `planType === 'premium'` and `interval === 'month'`
3. Review metadata passed to checkout session

---

## Future Enhancements

### Potential Updates
- [ ] Time-limited promotional periods
- [ ] A/B testing different discount amounts
- [ ] Referral-based coupons
- [ ] Multi-month promotional pricing
- [ ] Holiday/seasonal promotions

### Extending to Other Plans
To add promotions for other plans, create additional coupons:
```javascript
// Studio Plan Promotion Example
if (options.metadata?.planType === 'pro' && options.metadata?.interval === 'month') {
  sessionConfig.discounts = [{
    coupon: 'STUDIO_FIRST_MONTH' // Create this coupon separately
  }];
}
```

---

## Support

For issues or questions:
- **Backend Team**: Check `backend/src/services/stripeService.js`
- **Stripe Dashboard**: https://dashboard.stripe.com/coupons
- **Stripe Docs**: https://stripe.com/docs/billing/subscriptions/coupons

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: ✅ Active

