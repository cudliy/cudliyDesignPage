# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Cudliy application.

## Prerequisites

1. A Google Cloud Console account
2. Access to the Cudliy project

## Step 1: Create Google Cloud Project (if not exists)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" and click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the required fields:
     - App name: `Cudliy`
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Cudliy Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (alternative dev port)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (alternative dev port)
     - `https://your-production-domain.com` (for production)

5. Click **Create**
6. Copy the **Client ID** (it will look like: `123456789-abcdefg.apps.googleusercontent.com`)

## Step 4: Configure Environment Variables

### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=490286678728-q4lqv39qoh8ns3vpb4c9naqbv4nmfj7e.apps.googleusercontent.com
VITE_API_URL=http://localhost:3001/api
```

### Backend (backend/.env)
```env
GOOGLE_CLIENT_ID=490286678728-q4lqv39qoh8ns3vpb4c9naqbv4nmfj7e.apps.googleusercontent.com
```

**✅ Environment variables are now configured with your Google Client ID.**

## Step 5: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   ```

3. Navigate to the sign-in or sign-up page
4. Click the Google sign-in button
5. Complete the Google OAuth flow

## Step 6: Production Deployment

For production deployment:

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Update the environment variables with production values
3. Ensure HTTPS is enabled for production domains

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error:**
   - Check that your redirect URIs in Google Cloud Console match your application URLs
   - Ensure you've added both development and production URLs

2. **"invalid_client" error:**
   - Verify that the Client ID in your environment variables matches the one from Google Cloud Console
   - Check that the Client ID is correctly formatted

3. **"access_blocked" error:**
   - Make sure your OAuth consent screen is properly configured
   - Add test users if your app is in testing mode

4. **Google Sign-In button not appearing:**
   - Check browser console for JavaScript errors
   - Verify that the Google Identity Services script is loaded
   - Ensure your domain is authorized in Google Cloud Console

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded correctly
3. Test with different browsers
4. Check network requests in browser dev tools

## Security Notes

1. Never commit your actual Google Client ID to version control if it's sensitive
2. Use different Client IDs for development and production
3. Regularly rotate your credentials
4. Monitor usage in Google Cloud Console

## Features Implemented

✅ **Frontend Integration:**
- Google Identity Services integration
- Automatic token handling
- User data extraction from JWT
- Error handling and user feedback

✅ **Backend Integration:**
- Google token verification
- User creation/login logic
- JWT token generation
- Database user management

✅ **User Experience:**
- Seamless sign-in/sign-up flow
- Automatic account creation for new users
- Profile data synchronization
- Session management

## API Endpoints

- `POST /api/auth/google` - Google OAuth authentication
- Accepts: `{ credential: "google-jwt-token" }`
- Returns: `{ token, user, isNewUser }`

## Database Schema

The User model includes Google OAuth fields:
```javascript
googleAuth: {
  googleId: String,
  email: String,
  name: String,
  picture: String
}
```

## Next Steps

1. Set up Apple Sign-In (optional)
2. Add social login analytics
3. Implement account linking for existing users
4. Add profile picture sync from Google