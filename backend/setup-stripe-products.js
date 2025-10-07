import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('Setting up Stripe Products and Prices...\n');
    
    // 1. Create Creator Plan Product
    console.log('Creating Creator Plan product...');
    const creatorProduct = await stripe.products.create({
      name: 'Creator Plan',
      description: 'For everyday creators, who want to design with heart.',
      metadata: {
        planType: 'premium',
        features: '100 image generations/month, 50 model generations/month'
      }
    });
    console.log(`✓ Created Creator Plan: ${creatorProduct.id}\n`);
    
    // Create Creator Plan Monthly Price
    console.log('Creating Creator Plan monthly price...');
    const creatorMonthlyPrice = await stripe.prices.create({
      product: creatorProduct.id,
      unit_amount: 1499, // $14.99
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        planType: 'premium',
        displayPrice: '$14.99/month'
      }
    });
    console.log(`✓ Created monthly price: ${creatorMonthlyPrice.id} ($14.99/month)\n`);
    
    // Create Creator Plan Yearly Price
    console.log('Creating Creator Plan yearly price...');
    const creatorYearlyPrice = await stripe.prices.create({
      product: creatorProduct.id,
      unit_amount: 1299, // $12.99/month when billed yearly
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      metadata: {
        planType: 'premium',
        displayPrice: '$12.99/month billed yearly',
        billingType: 'yearly'
      }
    });
    console.log(`✓ Created yearly price: ${creatorYearlyPrice.id} ($12.99/month billed yearly)\n`);
    
    // 2. Create Studio Plan Product
    console.log('Creating Studio Plan product...');
    const studioProduct = await stripe.products.create({
      name: 'Studio Plan',
      description: 'Perfect for studios and professionals who want to scale their work.',
      metadata: {
        planType: 'pro',
        features: 'Unlimited image generations, 200 model generations/month'
      }
    });
    console.log(`✓ Created Studio Plan: ${studioProduct.id}\n`);
    
    // Create Studio Plan Monthly Price
    console.log('Creating Studio Plan monthly price...');
    const studioMonthlyPrice = await stripe.prices.create({
      product: studioProduct.id,
      unit_amount: 4999, // $49.99
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        planType: 'pro',
        displayPrice: '$49.99/month'
      }
    });
    console.log(`✓ Created monthly price: ${studioMonthlyPrice.id} ($49.99/month)\n`);
    
    // Create Studio Plan Yearly Price
    console.log('Creating Studio Plan yearly price...');
    const studioYearlyPrice = await stripe.prices.create({
      product: studioProduct.id,
      unit_amount: 5999, // $59.99/month when billed yearly
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      metadata: {
        planType: 'pro',
        displayPrice: '$59.99/month billed yearly',
        billingType: 'yearly'
      }
    });
    console.log(`✓ Created yearly price: ${studioYearlyPrice.id} ($59.99/month billed yearly)\n`);
    
    console.log('✅ All products and prices created successfully!\n');
    console.log('Summary:');
    console.log('========================================');
    console.log('Creator Plan (planType: premium)');
    console.log(`  Product ID: ${creatorProduct.id}`);
    console.log(`  Monthly Price ID: ${creatorMonthlyPrice.id}`);
    console.log(`  Yearly Price ID: ${creatorYearlyPrice.id}`);
    console.log('');
    console.log('Studio Plan (planType: pro)');
    console.log(`  Product ID: ${studioProduct.id}`);
    console.log(`  Monthly Price ID: ${studioMonthlyPrice.id}`);
    console.log(`  Yearly Price ID: ${studioYearlyPrice.id}`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Error setting up Stripe products:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n❌ Invalid Stripe API key. Please check your STRIPE_SECRET_KEY in .env file');
    } else if (error.type === 'StripePermissionError') {
      console.error('\n❌ Insufficient permissions. Make sure your Stripe key has product creation permissions');
    }
  }
}

setupStripeProducts();

