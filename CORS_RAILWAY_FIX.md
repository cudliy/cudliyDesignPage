# CORS Fix for Railway Deployment

## Issue
The frontend deployed on Vercel (`https://cudliy-design-page.vercel.app`) is being blocked by CORS policy when trying to access the Railway backend (`https://cudliy-backend-production.up.railway.app`).

## Error Details
```
Access to fetch at 'https://cudliy-backend-production.up.railway.app/api/designs/d7c180c0-0d21-49fc-a769-5bc017b6e4f1' from origin 'https://cudliy-design-page.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The Railway deployment doesn't have the updated CORS configuration that allows requests from the Vercel frontend domain.

## Fixes Applied

### 1. Enhanced CORS Configuration
```javascript
// Added comprehensive CORS handling
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) :
      [
        'https://cudliy-design-page.vercel.app',
        'https://www.cudliy-design-page.vercel.app',
        'https://cudliy-design-page-git-main.vercel.app',
        'https://cudliy-design-page-git-main-cudliy.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173'
      ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview deployments
    if (origin && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};
```

### 2. Enhanced Debugging
```javascript
// Added comprehensive request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`);
  if (req.method === 'OPTIONS') {
    console.log('CORS Preflight request from:', req.headers.origin);
    console.log('Request headers:', req.headers);
  }
  next();
});
```

### 3. Specific Route CORS Handler
```javascript
// Added specific CORS handler for designs route
app.use('/api/designs', (req, res, next) => {
  const origin = req.headers.origin;
  console.log(`Designs route ${req.method} ${req.originalUrl} from origin: ${origin}`);
  
  // Set CORS headers for all requests to designs route
  if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});
```

### 4. Enhanced Preflight Handler
```javascript
// Enhanced OPTIONS preflight handler with detailed logging
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('CORS Preflight OPTIONS request from origin:', origin);
  
  // ... detailed CORS logic with logging
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    console.log('CORS headers set for origin:', origin);
  } else {
    console.log('CORS blocked origin:', origin);
  }
  res.status(200).end();
});
```

## Deployment Steps

### 1. Deploy Updated Backend to Railway
```bash
# Commit the changes
git add .
git commit -m "Fix CORS configuration for Railway deployment"
git push origin main

# Railway will automatically deploy the updated code
```

### 2. Set Environment Variables on Railway
Make sure these environment variables are set on Railway:
```bash
CORS_ORIGINS=https://cudliy-design-page.vercel.app,https://www.cudliy-design-page.vercel.app
FRONTEND_URL=https://cudliy-design-page.vercel.app
NODE_ENV=production
```

### 3. Verify Deployment
Check the Railway logs to see if the CORS configuration is working:
```bash
# Look for these log messages:
# "CORS Preflight OPTIONS request from origin: https://cudliy-design-page.vercel.app"
# "CORS headers set for origin: https://cudliy-design-page.vercel.app"
```

## Testing

### 1. Test CORS Preflight
```bash
curl -X OPTIONS \
  -H "Origin: https://cudliy-design-page.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://cudliy-backend-production.up.railway.app/api/designs/test
```

### 2. Test Actual Request
```bash
curl -X GET \
  -H "Origin: https://cudliy-design-page.vercel.app" \
  https://cudliy-backend-production.up.railway.app/api/health
```

## Expected Results

After deployment, the frontend should be able to:
- ✅ Make preflight OPTIONS requests successfully
- ✅ Make actual API requests to the designs endpoint
- ✅ Receive proper CORS headers in responses
- ✅ Load 3D models and design data without CORS errors

## Troubleshooting

If CORS issues persist:

1. **Check Railway Logs**: Look for CORS-related log messages
2. **Verify Environment Variables**: Ensure CORS_ORIGINS is set correctly
3. **Test with curl**: Use the curl commands above to test CORS
4. **Check Network Tab**: Look at the actual request/response headers in browser dev tools

## Additional Notes

- The CORS configuration allows all Vercel preview deployments (`*.vercel.app`)
- Local development is also supported (`localhost:*`)
- Credentials are enabled for authenticated requests
- Preflight requests are cached for 24 hours to improve performance
