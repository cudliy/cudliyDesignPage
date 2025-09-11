import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

async function testCORS() {
  try {
    console.log('🔍 Testing CORS configuration...');
    
    const frontendUrl = 'https://cudliy-design-page.vercel.app';
    const backendUrl = 'https://cudliy.onrender.com';
    
    console.log(`🌐 Frontend URL: ${frontendUrl}`);
    console.log(`🔧 Backend URL: ${backendUrl}`);
    
    // Test 1: Health check endpoint
    console.log('\n1️⃣ Testing health check endpoint...');
    try {
      const healthResponse = await fetch(`${backendUrl}/api/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData.status);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }
    
    // Test 2: Debug checkout endpoint
    console.log('\n2️⃣ Testing debug checkout endpoint...');
    try {
      const debugResponse = await fetch(`${backendUrl}/api/debug/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': frontendUrl
        },
        body: JSON.stringify({
          userId: 'test-user-123',
          designId: 'test-design-456',
          quantity: 1
        })
      });
      
      const debugData = await debugResponse.json();
      console.log('✅ Debug checkout successful:', debugData.message);
    } catch (error) {
      console.log('❌ Debug checkout failed:', error.message);
    }
    
    // Test 3: CORS preflight request
    console.log('\n3️⃣ Testing CORS preflight (OPTIONS) request...');
    try {
      const optionsResponse = await fetch(`${backendUrl}/api/checkout/stripe`, {
        method: 'OPTIONS',
        headers: {
          'Origin': frontendUrl,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      console.log('📊 OPTIONS Response Status:', optionsResponse.status);
      console.log('📋 CORS Headers:');
      console.log('  Access-Control-Allow-Origin:', optionsResponse.headers.get('access-control-allow-origin'));
      console.log('  Access-Control-Allow-Methods:', optionsResponse.headers.get('access-control-allow-methods'));
      console.log('  Access-Control-Allow-Headers:', optionsResponse.headers.get('access-control-allow-headers'));
      console.log('  Access-Control-Allow-Credentials:', optionsResponse.headers.get('access-control-allow-credentials'));
      
      if (optionsResponse.status === 200) {
        console.log('✅ CORS preflight successful');
      } else {
        console.log('❌ CORS preflight failed');
      }
    } catch (error) {
      console.log('❌ CORS preflight test failed:', error.message);
    }
    
    // Test 4: Actual checkout request
    console.log('\n4️⃣ Testing actual checkout request...');
    try {
      const checkoutResponse = await fetch(`${backendUrl}/api/checkout/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': frontendUrl
        },
        body: JSON.stringify({
          userId: 'test-user-123',
          designId: 'test-design-456',
          quantity: 1
        })
      });
      
      console.log('📊 Checkout Response Status:', checkoutResponse.status);
      
      if (checkoutResponse.status === 200) {
        const checkoutData = await checkoutResponse.json();
        console.log('✅ Checkout request successful');
        console.log('📦 Response:', checkoutData);
      } else {
        const errorData = await checkoutResponse.text();
        console.log('❌ Checkout request failed');
        console.log('📦 Error Response:', errorData);
      }
    } catch (error) {
      console.log('❌ Checkout request test failed:', error.message);
    }
    
    console.log('\n🎉 CORS testing completed!');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
  }
}

testCORS();
