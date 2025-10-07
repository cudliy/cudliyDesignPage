import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkStripeProducts() {
  try {
    console.log('Checking Stripe Products and Prices...\n');
    
    // Get all products
    const products = await stripe.products.list({ limit: 100 });
    
    console.log(`Found ${products.data.length} product(s):\n`);
    
    for (const product of products.data) {
      console.log(`Product: ${product.name}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Active: ${product.active}`);
      console.log(`  Metadata:`, product.metadata);
      
      // Get prices for this product
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 100
      });
      
      console.log(`  Prices (${prices.data.length}):`);
      for (const price of prices.data) {
        console.log(`    - Price ID: ${price.id}`);
        console.log(`      Amount: ${price.unit_amount ? `$${price.unit_amount / 100}` : 'N/A'}`);
        console.log(`      Currency: ${price.currency.toUpperCase()}`);
        console.log(`      Interval: ${price.recurring?.interval || 'one-time'}`);
        console.log(`      Active: ${price.active}`);
        console.log(`      Metadata:`, price.metadata);
      }
      console.log('');
    }
    
    if (products.data.length === 0) {
      console.log('\n⚠️  No products found in Stripe!');
      console.log('You need to create products and prices in your Stripe Dashboard.');
      console.log('\nRecommended products to create:');
      console.log('1. Creator Plan (planType: premium)');
      console.log('   - Monthly price: $14.99/month');
      console.log('   - Yearly price: $12.99/month (billed yearly)');
      console.log('2. Studio Plan (planType: pro)');
      console.log('   - Monthly price: $49.99/month');
      console.log('   - Yearly price: $59.99/month (billed yearly)');
    }
    
  } catch (error) {
    console.error('Error checking Stripe products:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n❌ Invalid Stripe API key. Please check your STRIPE_SECRET_KEY in .env file');
    }
  }
}

checkStripeProducts();

