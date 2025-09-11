# URGENT: Render Deployment Fix

## Immediate Actions Required

### 1. Set Environment Variables in Render Dashboard

Go to your Render dashboard and add these environment variables:

**Required Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cudliy?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
FRONTEND_URL=https://cudliy-design-page.vercel.app
NODE_ENV=production
```

**Optional Variables:**
```
CORS_ORIGINS=https://cudliy-design-page.vercel.app,https://www.cudliy-design-page.vercel.app
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
```

### 2. Steps to Fix

1. **Go to Render Dashboard**
   - Navigate to your backend service
   - Click on "Environment" tab
   - Add each variable above

2. **Redeploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or push a new commit to trigger auto-deploy

### 3. Verify Fix

After deployment, check:
```bash
curl https://cudliy.onrender.com/api/health
```

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "message": "Backend is healthy",
  "services": {
    "database": "connected",
    "stripe": "configured"
  }
}
```

## What Was Fixed

1. **Removed invalid MongoDB options** (`bufferMaxEntries`, `bufferCommands`)
2. **Added default FRONTEND_URL** to prevent startup failure
3. **Made environment validation less strict** for non-critical variables

## If Still Failing

If you still get errors after setting environment variables:

1. Check Render logs for specific error messages
2. Verify MongoDB URI is correct and accessible
3. Ensure Stripe keys are valid (live keys for production)
4. Check that your MongoDB Atlas cluster allows connections from Render's IPs

The deployment should work now with these fixes!
