#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Creating split service account key for Railway...\n');

try {
  // Read the corrected service account key
  const keyPath = path.join(process.cwd(), 'keys', 'service-account-fixed.json');
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  
  console.log('📋 Service account details:');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  console.log(`   Private Key ID: ${serviceAccount.private_key_id}`);
  
  // Split the private key into smaller chunks
  const privateKey = serviceAccount.private_key;
  const chunkSize = 1000; // Split into chunks of 1000 characters
  const privateKeyChunks = [];
  
  for (let i = 0; i < privateKey.length; i += chunkSize) {
    privateKeyChunks.push(privateKey.slice(i, i + chunkSize));
  }
  
  console.log(`\n🔧 Split private key into ${privateKeyChunks.length} chunks`);
  
  // Create environment variables for each chunk
  console.log('\n📋 Environment variables for Railway:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Add these environment variables to Railway:                │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');
  
  // Basic info
  console.log('GOOGLE_CLOUD_PROJECT_ID=cudliy');
  console.log('GOOGLE_CLOUD_BUCKET_NAME=cudliy-img');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_TYPE=service_account');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_PROJECT_ID=cudliy');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_PRIVATE_KEY_ID=65c65a446be111dfc26f664c90487a04086e82e0');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_CLIENT_EMAIL=cudliy@cudliy.iam.gserviceaccount.com');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_CLIENT_ID=107888599166936586310');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/cudliy%40cudliy.iam.gserviceaccount.com');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_UNIVERSE_DOMAIN=googleapis.com');
  
  // Private key chunks
  for (let i = 0; i < privateKeyChunks.length; i++) {
    console.log(`GOOGLE_CLOUD_SERVICE_ACCOUNT_PRIVATE_KEY_CHUNK_${i}=${privateKeyChunks[i]}`);
  }
  
  console.log(`\nGOOGLE_CLOUD_SERVICE_ACCOUNT_PRIVATE_KEY_CHUNKS=${privateKeyChunks.length}`);
  
  console.log('\n🚀 After adding these variables, update the GCS service to use split keys!');
  
} catch (error) {
  console.error('❌ Error creating split service account key:', error.message);
}
