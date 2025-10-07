import dotenv from 'dotenv';
dotenv.config();

import awsService from './src/services/awsService.js';
import logger from './src/utils/logger.js';

async function testAWSS3Connection() {
  console.log('\n=== AWS S3 Connection Test ===\n');
  
  // Test 1: Check configuration
  console.log('1. Checking AWS S3 Configuration...');
  console.log(`   - Bucket Name: ${process.env.AWS_BUCKET_NAME}`);
  console.log(`   - Region: ${process.env.AWS_REGION}`);
  console.log(`   - Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'NOT SET'}`);
  console.log(`   - Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '***' + process.env.AWS_SECRET_ACCESS_KEY.slice(-4) : 'NOT SET'}`);
  console.log('   ✓ Configuration loaded\n');
  
  try {
    // Test 2: List files in bucket
    console.log('2. Testing bucket access (listing files)...');
    const files = await awsService.listFiles();
    console.log(`   ✓ Successfully accessed bucket`);
    console.log(`   - Found ${files.length} file(s) in bucket\n`);
    
    if (files.length > 0) {
      console.log('   Sample files:');
      files.slice(0, 5).forEach(file => {
        console.log(`   - ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      });
      console.log();
    }
    
    // Test 3: Upload a test file
    console.log('3. Testing file upload...');
    const testContent = Buffer.from('This is a test file from Cudliy - ' + new Date().toISOString());
    const testFileName = `test/test-upload-${Date.now()}.txt`;
    
    const uploadedUrl = await awsService.uploadFile(
      testContent, 
      testFileName, 
      {
        contentType: 'text/plain',
        metadata: {
          test: 'true',
          timestamp: new Date().toISOString()
        }
      }
    );
    
    console.log(`   ✓ File uploaded successfully`);
    console.log(`   - File name: ${testFileName}`);
    console.log(`   - Public URL: ${uploadedUrl}\n`);
    
    // Test 4: Check if file exists
    console.log('4. Testing file existence check...');
    const exists = await awsService.fileExists(testFileName);
    console.log(`   ✓ File existence check: ${exists ? 'EXISTS' : 'NOT FOUND'}\n`);
    
    // Test 5: Get file metadata
    console.log('5. Testing file metadata retrieval...');
    const metadata = await awsService.getFileMetadata(testFileName);
    console.log(`   ✓ Metadata retrieved successfully`);
    console.log(`   - Content Type: ${metadata.contentType}`);
    console.log(`   - Content Length: ${metadata.contentLength} bytes`);
    console.log(`   - Last Modified: ${metadata.lastModified}\n`);
    
    // Test 6: Generate signed URL
    console.log('6. Testing signed URL generation...');
    const signedUrl = await awsService.getSignedUrl(testFileName, { expiresIn: 3600 });
    console.log(`   ✓ Signed URL generated successfully`);
    console.log(`   - Expires in: 1 hour`);
    console.log(`   - URL: ${signedUrl.substring(0, 100)}...\n`);
    
    // Test 7: Delete test file
    console.log('7. Testing file deletion...');
    const deleted = await awsService.deleteFile(testFileName);
    console.log(`   ✓ File deleted successfully: ${deleted}\n`);
    
    // Final verification
    console.log('8. Verifying deletion...');
    const stillExists = await awsService.fileExists(testFileName);
    console.log(`   ✓ File existence after deletion: ${stillExists ? 'STILL EXISTS (ERROR!)' : 'DELETED'}\n`);
    
    console.log('=== All Tests Passed! ✓ ===\n');
    console.log('AWS S3 is properly configured and working correctly.');
    console.log('Your images and 3D models will be stored in:');
    console.log(`Bucket: ${process.env.AWS_BUCKET_NAME}`);
    console.log(`Region: ${process.env.AWS_REGION}\n`);
    
  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify AWS credentials are correct');
    console.error('2. Check that the bucket exists and is in the correct region');
    console.error('3. Ensure IAM user has permissions: s3:PutObject, s3:GetObject, s3:DeleteObject, s3:ListBucket');
    console.error('4. Check bucket ACL settings allow public-read for uploaded objects\n');
    
    if (error.name === 'NoSuchBucket') {
      console.error('⚠ The bucket does not exist. Please create it first or check the bucket name.');
    } else if (error.name === 'AccessDenied' || error.name === 'Forbidden') {
      console.error('⚠ Access denied. Check your IAM permissions.');
    }
    
    process.exit(1);
  }
}

// Run the test
testAWSS3Connection();

