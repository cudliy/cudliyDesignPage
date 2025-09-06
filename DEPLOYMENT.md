# 🚀 Render Deployment Guide

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Prepare all required API keys and secrets

## 🎯 Quick Deployment Steps

### 1. Connect to Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your backend code

### 2. Configure the Service

**Service Settings:**
- **Name**: `cudliy-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root level)
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

### 3. Environment Variables

Add these environment variables in Render dashboard:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `10000` | ✅ |
| `MONGODB_URI` | Your MongoDB connection string | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `REPLICATE_API_TOKEN` | Replicate API token | ✅ |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud Project ID | ✅ |
| `GOOGLE_CLOUD_BUCKET_NAME` | GCS bucket name | ✅ |
| `GOOGLE_CLOUD_PRIVATE_KEY` | GCS service account private key | ✅ |
| `GOOGLE_CLOUD_CLIENT_EMAIL` | GCS service account email | ✅ |
| `JWT_SECRET` | Random secret for JWT tokens | ✅ |

### 4. Advanced Settings

**Health Check:**
- **Health Check Path**: `/api/health`
- **Health Check Timeout**: `180` seconds

**Auto-Deploy:**
- ✅ Enable "Auto-Deploy"

## 🔧 Environment Variables Setup

### MongoDB Atlas
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### OpenAI
```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

### Replicate
```bash
REPLICATE_API_TOKEN=r8_your-replicate-token
```

### Google Cloud Storage
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
```

### JWT Secret
```bash
JWT_SECRET=your-super-secret-jwt-key-here
```

## 🚀 Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your application
   - Provide a public URL

## 📊 Monitoring

### Health Check
Your app includes a health check endpoint at `/api/health` that returns:
```json
{
  "success": true,
  "message": "Backend is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Logs
- View real-time logs in Render dashboard
- Monitor application performance
- Debug deployment issues

## 🔄 Continuous Deployment

- Every push to your main branch triggers automatic deployment
- Render builds and deploys your changes automatically
- Zero-downtime deployments

## 🌐 Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Configure DNS records as instructed

## 🛠️ Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Ensure build command is correct

**Runtime Errors:**
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check API keys are valid

**Health Check Failures:**
- Ensure `/api/health` endpoint is accessible
- Check application starts successfully
- Verify PORT environment variable

### Debug Commands

```bash
# Check logs
render logs

# Restart service
render restart

# Check service status
render status
```

## 📈 Scaling

**Free Tier:**
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- Cold starts on first request

**Paid Plans:**
- Always-on services
- Custom domains
- SSL certificates
- Better performance

## 🔒 Security

- Environment variables are encrypted
- HTTPS enabled by default
- CORS configured for production
- Rate limiting enabled
- Helmet.js security headers

## 📞 Support

- Render Documentation: [docs.render.com](https://docs.render.com)
- Community Forum: [community.render.com](https://community.render.com)
- Status Page: [status.render.com](https://status.render.com)

---

**Your backend will be available at:** `https://your-service-name.onrender.com`
