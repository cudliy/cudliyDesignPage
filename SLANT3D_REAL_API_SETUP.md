# Slant3D Real API Integration Setup

## 🚀 Getting Started with Real Slant3D API

### ✅ Real Slant3D API Integration
The integration now uses the **official Slant3D API** at `https://www.slant3dapi.com/api` with complete endpoint support for pricing, orders, and tracking.

### Step 1: Get Your Slant3D API Key

1. **Visit Slant3D API Page**: Go to [https://www.slant3d.com/slant-3d-printing-api](https://www.slant3d.com/slant-3d-printing-api)
2. **Sign Up**: Create an account and request API access
3. **Join Discord**: Join their Discord community for support and updates
4. **Get API Key**: Once approved, you'll receive your API key and documentation
5. **Verify Endpoints**: Confirm the correct API base URL and endpoints with Slant3D support

### Step 2: Configure Environment Variables

1. **Copy Environment File**:
   ```bash
   cp env.example .env.local
   ```

2. **Update .env.local** with your real API key and base URL:
   ```env
   # Slant3D API Configuration
   VITE_SLANT3D_API_KEY=your_actual_slant3d_api_key_here
   VITE_SLANT3D_API_BASE=https://www.slant3dapi.com/api
   
   # Backend API Configuration  
   VITE_API_BASE_URL=http://localhost:3001/api
   
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
   
   # Development Mode
   VITE_DEV_MODE=true
   ```

### Step 3: API Integration Features

The integration now includes:

#### ✅ **Real-Time Pricing**
- Uploads 3D models to Slant3D
- Gets actual pricing based on material, quantity, and complexity
- Shows real shipping costs and estimated delivery times

#### ✅ **Material Options**
- PLA (default)
- ABS
- PETG
- TPU
- Wood
- Carbon Fiber

#### ✅ **Real API Only**
- Uses only real Slant3D API data - no mock fallback
- Shows clear error messages if API is not configured or fails
- Requires valid API key to function

#### ✅ **GLB to STL Conversion**
- Automatically converts GLB files to STL for Slant3D compatibility
- Client-side conversion with backend fallback

### Step 4: Testing the Integration

1. **Start the Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the Frontend**:
   ```bash
   npm run dev
   ```

3. **Test the Flow**:
   - Generate a 3D model
   - Check that pricing shows real Slant3D data
   - Proceed to checkout
   - Verify order creation

### Step 5: API Endpoints Used

The integration uses these Slant3D API endpoints:

- `POST /api/order/estimate` - Get pricing estimate
- `POST /api/order` - Create order
- `POST /api/order/estimateShipping` - Get shipping estimate
- `GET /api/order/{orderId}/get-tracking` - Get order tracking
- `GET /api/order/` - Get all orders
- `DELETE /api/order/{orderId}` - Cancel order

### Step 6: Error Handling

The system includes comprehensive error handling:

- **API Failures**: Shows clear error messages and disables ordering
- **Network Issues**: Displays "Pricing Unavailable" message
- **Invalid Models**: Provides clear error messages
- **Rate Limiting**: Handles API rate limits gracefully
- **No API Key**: Shows configuration error message

### Step 7: Production Deployment

For production deployment:

1. **Set Environment Variables** in your hosting platform
2. **Update API Base URL** to production Slant3D endpoint
3. **Test Thoroughly** with real models and orders
4. **Monitor API Usage** and costs

## 🔧 Troubleshooting

### Common Issues:

1. **"API Key Invalid"**: Check your API key in .env.local
2. **"Model Upload Failed"**: Ensure model is in STL format
3. **"Pricing Not Loading"**: Check network connection and API status
4. **"Conversion Failed"**: Verify GLB file is valid
5. **"ERR_NAME_NOT_RESOLVED"**: The API endpoint `api.slant3d.com` may not be correct
6. **"API is not accessible"**: The Slant3D API may be down or endpoints may have changed

### Beta API Issues:

Since the Slant3D API is in beta, you may encounter:
- **Incorrect Endpoints**: The API base URL or endpoints may be different
- **Limited Documentation**: Full API documentation may not be available
- **Access Restrictions**: API access may be limited to select partners
- **Frequent Changes**: Endpoints and parameters may change during beta

**Solution**: Contact Slant3D support directly for:
- Correct API base URL
- Current endpoint documentation
- API access approval
- Beta testing guidelines

### Debug Mode:

Enable debug logging by setting:
```env
VITE_DEV_MODE=true
```

This will show detailed console logs for API calls and responses.

## 📊 Expected Results

With real Slant3D integration, you should see:

- **Accurate Pricing**: Real costs based on model complexity
- **Material Options**: Multiple material choices with different prices
- **Shipping Estimates**: Actual delivery times and costs
- **Order Tracking**: Real order IDs and status updates

## 🎯 Next Steps

1. **Get API Key**: Sign up at Slant3D
2. **Update Environment**: Add your real API key
3. **Test Integration**: Verify everything works
4. **Deploy**: Push to production
5. **Monitor**: Track API usage and costs

The integration is now ready for real Slant3D API usage! 🚀
