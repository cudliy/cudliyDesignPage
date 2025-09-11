import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

async function testStripe() {
  try {
    console.log('🔍 Testing Stripe configuration...');
    
    // Check if Stripe key is set
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('❌ STRIPE_SECRET_KEY is not set in environment variables');
      return;
    }
    
    console.log('🔑 Stripe Secret Key found:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');
    
    // Check key format
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      console.log('⚠️  Using TEST key - this should be used for development only');
    } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      console.log('✅ Using LIVE key - this is for production');
    } else {
      console.log('❌ Invalid Stripe key format. Should start with sk_test_ or sk_live_');
      return;
    }
    
    // Test Stripe connection
    console.log('🔌 Testing Stripe API connection...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    
    // Try to retrieve account information
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe connection successful!');
    console.log(`📊 Account ID: ${account.id}`);
    console.log(`🏢 Account Type: ${account.type}`);
    console.log(`🌍 Country: ${account.country}`);
    console.log(`💰 Charges Enabled: ${account.charges_enabled}`);
    console.log(`💳 Payouts Enabled: ${account.payouts_enabled}`);
    
    // Test creating a test customer
    console.log('👤 Testing customer creation...');
    const testCustomer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: {
        test: 'true'
      }
    });
    console.log('✅ Test customer created successfully');
    console.log(`🆔 Customer ID: ${testCustomer.id}`);
    
    // Clean up test customer
    await stripe.customers.del(testCustomer.id);
    console.log('🧹 Test customer cleaned up');
    
    console.log('🎉 Stripe configuration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔐 Authentication Error: Check your Stripe secret key');
    } else if (error.type === 'StripeInvalidRequestError') {
      console.log('📝 Invalid Request: Check your API version or request format');
    } else if (error.type === 'StripeAPIError') {
      console.log('🌐 API Error: Check your internet connection and Stripe service status');
    } else if (error.type === 'StripeConnectionError') {
      console.log('🔌 Connection Error: Check your internet connection');
    } else if (error.type === 'StripeRateLimitError') {
      console.log('⏱️  Rate Limit Error: Too many requests, try again later');
    }
  }
}

testStripe();
