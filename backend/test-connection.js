import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('🔍 Testing backend configuration...');
    
    // Test MongoDB connection
    console.log('📊 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Test environment variables
    console.log('🔧 Checking environment variables...');
    const requiredVars = [
      'MONGODB_URI',
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_BUCKET_NAME',
      'OPENAI_API_KEY',
      'REPLICATE_API_TOKEN'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars);
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Test Google Cloud Storage
    console.log('☁️  Testing Google Cloud Storage...');
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
      });
      
      console.log('✅ Google Cloud Storage client initialized successfully');
      console.log(`📦 Bucket name: ${process.env.GOOGLE_CLOUD_BUCKET_NAME}`);
      
      // Skip bucket existence check for now - will be created on first upload
      console.log('ℹ️  Bucket will be created automatically on first file upload');
      
    } catch (error) {
      console.log('❌ Google Cloud Storage test failed:', error.message);
    }
    
    console.log('🎉 Backend configuration test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConnection();
