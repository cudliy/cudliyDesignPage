import express from 'express';
import multer from 'multer';
import crypto from 'crypto';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload images directly to Cloudflare R2 using REST API
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const uniqueFileName = `shared-images/${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
      
      try {
        // Upload to Cloudflare R2 using REST API
        const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${process.env.CLOUDFLARE_BUCKET_NAME}/objects/${uniqueFileName}`;
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': file.mimetype,
          },
          body: file.buffer,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Return public URL (you may need to configure custom domain)
        return `https://pub-1ed89e0d7a8c4a12b06428c0c9047120.r2.dev/${uniqueFileName}`;
      } catch (error) {
        console.error('Error uploading to R2:', error);
        
        // Fallback: return base64 data URL
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return base64;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      urls: uploadedUrls
    });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'upload',
    r2Config: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? 'configured' : 'missing',
      apiToken: process.env.CLOUDFLARE_API_TOKEN ? 'configured' : 'missing',
      bucketName: process.env.CLOUDFLARE_BUCKET_NAME || 'not set'
    }
  });
});

// Test R2 connection endpoint
router.get('/test-r2', async (req, res) => {
  try {
    const testUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ 
        status: 'success', 
        message: 'R2 connection successful',
        buckets: data.result?.length || 0
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'R2 connection failed',
        error: response.statusText
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'R2 test failed',
      error: error.message
    });
  }
});

export default router;