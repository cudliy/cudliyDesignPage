import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupPromotionalCoupon() {
  try {
    console.log('Setting up promotional coupon for Creator Plan...\n');
    
    // Check if coupon already exists
    let existingCoupon;
    try {
      existingCoupon = await stripe.coupons.retrieve('CREATOR_FIRST_MONTH');
    } catch (error) {
      // Coupon doesn't exist, we'll create it
    }

    if (existingCoupon) {
      console.log('✓ Promotional coupon already exists:', existingCoupon.id);
      console.log(`  Amount Off: $${existingCoupon.amount_off / 100}`);
      console.log(`  Duration: ${existingCoupon.duration}`);
      console.log(`  Valid: ${existingCoupon.valid}`);
      return;
    }

    // Create promotional coupon: $5 off first month (makes $14.99 -> $9.99)
    const coupon = await stripe.coupons.create({
      id: 'CREATOR_FIRST_MONTH',
      amount_off: 500, // $5.00 off in cents
      currency: 'usd',
      duration: 'once', // Apply only to first invoice
      name: 'Creator Plan - First Month Discount',
      metadata: {
        planType: 'premium',
        promotion: 'first_month',
        description: '$9.99 for first month, then $14.99/month'
      }
    });

    console.log('✅ Promotional coupon created successfully!\n');
    console.log('Coupon Details:');
    console.log('========================================');
    console.log(`Coupon ID: ${coupon.id}`);
    console.log(`Name: ${coupon.name}`);
    console.log(`Amount Off: $${coupon.amount_off / 100}`);
    console.log(`Currency: ${coupon.currency.toUpperCase()}`);
    console.log(`Duration: ${coupon.duration}`);
    console.log(`Valid: ${coupon.valid}`);
    console.log('========================================\n');
    console.log('💡 This coupon will be automatically applied to Creator Plan monthly subscriptions');
    console.log('   First month: $14.99 - $5.00 = $9.99');
    console.log('   Following months: $14.99');
    
  } catch (error) {
    console.error('Error setting up promotional coupon:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n❌ Invalid Stripe API key. Please check your STRIPE_SECRET_KEY in .env file');
    } else if (error.type === 'StripePermissionError') {
      console.error('\n❌ Insufficient permissions. Make sure your Stripe key has coupon creation permissions');
    }
  }
}

setupPromotionalCoupon();

