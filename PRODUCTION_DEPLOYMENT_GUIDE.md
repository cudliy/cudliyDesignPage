# Production Deployment Guide

## Issues Fixed

### 1. API Response Structure Mismatch
- **Problem**: Frontend expected `generatedImages` array but backend used `images`
- **Solution**: Updated Design model to include both `generatedImages` and `images` for backward compatibility
- **Files Modified**: `backend/src/models/Design.js`

### 2. Error Response Format Inconsistency
- **Problem**: Backend error responses didn't match frontend expectations
- **Solution**: Standardized error responses to include `success: false`, `error`, and `message` fields
- **Files Modified**: `backend/src/utils/errorHandler.js`, `src/services/api.ts`

### 3. Database Connection Stability
- **Problem**: MongoDB connection was unstable with frequent disconnections
- **Solution**: Added connection pooling, retry logic, and graceful degradation
- **Files Modified**: `backend/src/config/database.js`

### 4. Missing Environment Variables
- **Problem**: No .env file and missing required environment variables
- **Solution**: Created production environment template and validation
- **Files Created**: `backend/production.env.example`

### 5. Stripe Integration Issues
- **Problem**: Missing Stripe configuration causing 500 errors
- **Solution**: Added proper error handling and environment validation
- **Files Modified**: `backend/src/controllers/checkoutController.js`, `backend/src/services/stripeService.js`

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```bash
# Database Configuration (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Stripe Configuration (REQUIRED for checkout)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (REQUIRED)
FRONTEND_URL=https://cudliy-design-page.vercel.app

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Origins (comma-separated)
CORS_ORIGINS=https://cudliy-design-page.vercel.app,https://www.cudliy-design-page.vercel.app

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_BUCKET_NAME=your_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
```

## Deployment Steps

### 1. Backend Deployment (Render.com)

1. **Set Environment Variables**:
   - Go to your Render dashboard
   - Navigate to your backend service
   - Go to Environment tab
   - Add all required environment variables from the list above

2. **Deploy**:
   - Push your changes to the main branch
   - Render will automatically deploy the changes

### 2. Frontend Deployment (Vercel)

1. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Go to Environment Variables tab
   - Add: `VITE_API_URL=https://cudliy.onrender.com/api`

2. **Deploy**:
   - Push your changes to the main branch
   - Vercel will automatically deploy the changes

### 3. Database Setup (MongoDB Atlas)

1. **Create Database**:
   - Create a new cluster in MongoDB Atlas
   - Create a database named `cudliy`
   - Create a user with read/write permissions
   - Get the connection string

2. **Configure Network Access**:
   - Add your Render.com IP addresses to the whitelist
   - Or use 0.0.0.0/0 for all IPs (less secure but easier)

### 4. Stripe Setup

1. **Create Stripe Account**:
   - Sign up at stripe.com
   - Complete account verification
   - Get your API keys from the dashboard

2. **Configure Webhooks**:
   - Go to Webhooks in Stripe dashboard
   - Add endpoint: `https://cudliy.onrender.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
   - Copy the webhook secret

## Testing the Deployment

### 1. Health Check
```bash
curl https://cudliy.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "message": "Backend is healthy",
  "timestamp": "2025-01-09T...",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "stripe": "configured"
  }
}
```

### 2. Test Checkout Flow
1. Go to your frontend URL
2. Create a design
3. Try to checkout
4. Check that Stripe checkout loads properly

## Monitoring

### 1. Backend Logs
- Check Render.com logs for any errors
- Monitor database connection status
- Watch for Stripe API errors

### 2. Frontend Logs
- Check Vercel function logs
- Monitor API call failures
- Watch for CORS errors

## Troubleshooting

### Common Issues

1. **500 Internal Server Error on Checkout**:
   - Check if STRIPE_SECRET_KEY is set correctly
   - Verify MONGODB_URI is accessible
   - Check backend logs for specific error messages

2. **CORS Errors**:
   - Verify CORS_ORIGINS includes your frontend URL
   - Check that FRONTEND_URL matches your actual frontend URL

3. **Database Connection Issues**:
   - Verify MONGODB_URI is correct
   - Check MongoDB Atlas network access settings
   - Monitor connection retry attempts in logs

4. **Stripe Errors**:
   - Verify API keys are correct (live vs test)
   - Check webhook endpoint is accessible
   - Verify webhook secret is correct

## Security Considerations

1. **Environment Variables**:
   - Never commit .env files to version control
   - Use strong, unique secrets for JWT and Stripe
   - Rotate secrets regularly

2. **Database Security**:
   - Use strong passwords
   - Enable IP whitelisting
   - Use MongoDB Atlas security features

3. **API Security**:
   - Rate limiting is enabled
   - CORS is properly configured
   - Input validation is in place

## Performance Optimization

1. **Database**:
   - Connection pooling is configured
   - Indexes are in place for common queries
   - Connection retry logic prevents failures

2. **API**:
   - Compression is enabled
   - Rate limiting prevents abuse
   - Proper error handling prevents crashes

3. **Frontend**:
   - API calls are optimized
   - Error handling provides good UX
   - Loading states prevent confusion
