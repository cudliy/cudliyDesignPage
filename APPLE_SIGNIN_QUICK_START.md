# Apple Sign-In Quick Start Guide

## Direct Links

1. **Identifiers Page**: https://developer.apple.com/account/resources/identifiers/list
2. **Keys Page**: https://developer.apple.com/account/resources/authkeys/list

## Step-by-Step Setup (5 minutes)

### Step 1: Create Services ID (Your Client ID)

1. Go to: https://developer.apple.com/account/resources/identifiers/list
2. Click the **"+"** button (top left, next to "Identifiers")
3. Select **"Services IDs"** → Click **"Continue"**
4. Fill in:
   - **Description**: `Cudliy Sign In`
   - **Identifier**: `com.cudliy.signin` ← **This is your VITE_APPLE_CLIENT_ID**
5. Check the box: **"Sign In with Apple"**
6. Click **"Configure"** button next to "Sign In with Apple"
7. In the popup:
   - **Domains and Subdomains**: Add `cudliy.com`
   - **Return URLs**: Add `https://cudliy.com`
   - For development, also add: `http://localhost:5173`
8. Click **"Save"** → **"Continue"** → **"Register"**

### Step 2: Update Your .env File

```env
VITE_APPLE_CLIENT_ID=com.cudliy.signin
VITE_APPLE_REDIRECT_URI=https://cudliy.com
```

### Step 3: Test It!

1. Restart your dev server
2. Go to your sign-in page
3. Click the Apple sign-in button
4. It should work! (Apple will verify your domain automatically for localhost)

## That's It!

For basic web Sign In with Apple, you only need the Services ID. The private key is only needed if you want to verify tokens on the backend (which we do, but it can work without it initially for testing).

## If You Get Errors

### "Invalid client"
- Make sure the Services ID identifier matches exactly: `com.cudliy.signin`
- Check that you enabled "Sign In with Apple" on the Services ID

### "Domain not verified"
- For localhost: Should work automatically
- For production: Apple verifies automatically, but may take a few minutes

### "Popup blocked"
- Allow popups in your browser for localhost/cudliy.com

## For Production (Later)

You'll need to:
1. Create an App ID first (before Services ID)
2. Add your production domain to the Services ID configuration
3. Optionally create a private key for backend token verification

But for now, just the Services ID is enough to test!
