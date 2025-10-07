import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixYearlyPrices() {
  try {
    console.log('Fixing Stripe Yearly Prices...\n');
    
    // Get all products
    const products = await stripe.products.list({ limit: 100 });
    
    for (const product of products.data) {
      console.log(`\nProcessing: ${product.name} (${product.id})`);
      console.log(`Plan Type: ${product.metadata.planType}`);
      
      // Get existing prices
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 100
      });
      
      // Find and archive the incorrect yearly price (interval: month with billingType: yearly)
      const incorrectYearlyPrice = prices.data.find(p => 
        p.recurring?.interval === 'month' && 
        p.metadata?.billingType === 'yearly'
      );
      
      if (incorrectYearlyPrice) {
        console.log(`  Found incorrect yearly price: ${incorrectYearlyPrice.id}`);
        console.log(`  Archiving incorrect price...`);
        await stripe.prices.update(incorrectYearlyPrice.id, { active: false });
        console.log(`  ✓ Archived`);
        
        // Create correct yearly price
        let yearlyAmount;
        if (product.metadata.planType === 'premium') {
          yearlyAmount = 1299 * 12; // $12.99/month * 12 = $155.88/year
        } else if (product.metadata.planType === 'pro') {
          yearlyAmount = 5999 * 12; // $59.99/month * 12 = $719.88/year
        }
        
        if (yearlyAmount) {
          console.log(`  Creating correct yearly price: $${yearlyAmount / 100}/year`);
          const newYearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: yearlyAmount,
            currency: 'usd',
            recurring: {
              interval: 'year'
            },
            metadata: {
              planType: product.metadata.planType,
              displayPrice: product.metadata.planType === 'premium' 
                ? '$12.99/month billed yearly ($155.88/year)' 
                : '$59.99/month billed yearly ($719.88/year)',
              billingType: 'yearly'
            }
          });
          console.log(`  ✓ Created new yearly price: ${newYearlyPrice.id}`);
        }
      }
    }
    
    console.log('\n✅ All yearly prices fixed!\n');
    console.log('Summary:');
    console.log('========================================');
    
    // Show updated prices
    for (const product of products.data) {
      console.log(`\n${product.name} (${product.metadata.planType}):`);
      const prices = await stripe.prices.list({ 
        product: product.id,
        active: true,
        limit: 100
      });
      
      for (const price of prices.data) {
        console.log(`  - ${price.id}`);
        console.log(`    Amount: $${price.unit_amount / 100}`);
        console.log(`    Interval: ${price.recurring?.interval}`);
        console.log(`    Metadata:`, price.metadata);
      }
    }
    console.log('\n========================================\n');
    
  } catch (error) {
    console.error('Error fixing yearly prices:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n❌ Invalid Stripe API key. Please check your STRIPE_SECRET_KEY in .env file');
    }
  }
}

fixYearlyPrices();
