# Railway Setup - Secure Version

## 🔐 Security Notice
This file contains placeholder values for API keys. Replace them with your actual API keys when setting up your Railway environment.

## 🚀 Quick Setup

### 1. Set Environment Variables Manually
Run these commands with your actual API keys:

```bash
# Critical AI Services
railway variables --set OPENAI_API_KEY="your_actual_openai_key"
railway variables --set FAL_API_KEY="your_actual_fal_key"
railway variables --set REPLICATE_API_TOKEN="your_actual_replicate_token"
railway variables --set MONGODB_URI="your_actual_mongodb_uri"
railway variables --set JWT_SECRET="your_actual_jwt_secret"

# Optional Services
railway variables --set OPENROUTER_API_KEY="your_actual_openrouter_key"
railway variables --set STRIPE_SECRET_KEY="your_actual_stripe_secret"
railway variables --set STRIPE_PUBLISHABLE_KEY="your_actual_stripe_publishable"
railway variables --set SLANT3D_API_KEY="your_actual_slant3d_key"
```

### 2. Deploy
```bash
railway up
```

## 📋 Required API Keys

You'll need to obtain these API keys and replace the placeholders:

- **OPENAI_API_KEY**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **FAL_API_KEY**: Get from [FAL.ai](https://fal.ai/dashboard/keys)
- **REPLICATE_API_TOKEN**: Get from [Replicate](https://replicate.com/account/api-tokens)
- **MONGODB_URI**: Get from [MongoDB Atlas](https://cloud.mongodb.com/)
- **JWT_SECRET**: Generate a secure random string
- **STRIPE_SECRET_KEY**: Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **STRIPE_PUBLISHABLE_KEY**: Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **SLANT3D_API_KEY**: Get from [Slant3D](https://slant3d.com/)

## 🔧 Alternative: Use Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your `cudliy-design` project
3. Go to the `backend` service
4. Click on "Variables" tab
5. Add each variable manually

## ✅ After Setting Variables

```bash
# Check variables are set
railway variables

# Deploy
railway up

# Check logs
railway logs
```

## 🎯 Your Backend URL
Once deployed, your backend will be available at:
`https://cudliydesign-production.up.railway.app/api`

## 🛡️ Security Best Practices

- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor your API usage and costs
- Use different keys for development and production
