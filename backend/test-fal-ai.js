import dotenv from 'dotenv';
dotenv.config();
import { fal } from '@fal-ai/client';

async function testFalAI() {
  try {
    console.log('Testing fal.ai connection...');
    
    // Initialize fal.ai client
    fal.config({
      credentials: process.env.FAL_API_KEY || '95638d63-2011-4a66-bf8a-b3647febaf43:cb00658666e670d5ae87a52ce827b874'
    });
    
    console.log('fal.ai client initialized');
    console.log('Testing with a simple image...');
    
    // Test with a simple image URL
    const testImageUrl = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop';
    
    const result = await fal.subscribe("fal-ai/triposr", {
      input: {
        image_url: testImageUrl
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Status:', update.status);
        if (update.logs) {
          update.logs.forEach(log => console.log('Log:', log.message));
        }
      },
    });
    
    console.log('Success! Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing fal.ai:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

testFalAI();

