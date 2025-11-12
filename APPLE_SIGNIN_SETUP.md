# Apple Sign-In Setup Guide

## Prerequisites
- Apple Developer Account ($99/year)
- Access to Apple Developer Console

## Step 1: Create an App ID

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → Continue
5. Select **App** → Continue
6. Configure your App ID:
   - Description: `Cudliy Web App`
   - Bundle ID: `com.cudliy.webapp` (or your domain)
   - Capabilities: Check **Sign In with Apple**
7. Click **Continue** → **Register**

## Step 2: Create a Services ID

1. In **Identifiers**, click **+** button again
2. Select **Services IDs** → Continue
3. Configure:
   - Description: `Cudliy Sign In`
   - Identifier: `com.cudliy.signin` (this will be your CLIENT_ID)
4. Check **Sign In with Apple**
5. Click **Configure** next to Sign In with Apple
6. Configure domains and URLs:
   - **Primary App ID**: Select the App ID you created
   - **Domains and Subdomains**: 
     - `cudliy.com`
     - `www.cudliy.com`
     - `app.cudliy.com`
   - **Return URLs**:
     - `https://cudliy.com`
     - `https://www.cudliy.com`
     - `https://app.cudliy.com`
     - `http://localhost:5173` (for development)
7. Click **Save** → **Continue** → **Register**

## Step 3: Create a Private Key

1. Go to **Keys** → **+** button
2. Configure:
   - Key Name: `Cudliy Sign In Key`
   - Check **Sign In with Apple**
   - Click **Configure** → Select your Primary App ID
3. Click **Continue** → **Register**
4. **Download the key file** (.p8) - you can only download it once!
5. Note the **Key ID** shown on the page

## Step 4: Get Your Team ID

1. Go to **Membership** in the sidebar
2. Copy your **Team ID** (10 characters)

## Step 5: Update Environment Variables

### Frontend (.env)
```env
VITE_APPLE_CLIENT_ID=com.cudliy.signin
VITE_APPLE_REDIRECT_URI=https://cudliy.com
```

### Backend (Railway Environment Variables)
```env
APPLE_CLIENT_ID=com.cudliy.signin
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END PRIVATE KEY-----
```

## Step 6: Verify Domain Ownership

1. Apple will require you to verify domain ownership
2. Download the verification file from Apple Developer Console
3. Place it at: `https://cudliy.com/.well-known/apple-developer-domain-association.txt`
4. Ensure it's accessible publicly

## Step 7: Test

1. Update `.env` with your Apple Client ID
2. Restart your development server
3. Try signing in with Apple
4. Check browser console for any errors

## Important Notes

- **First Sign-In**: Apple only provides user info (name, email) on the FIRST sign-in. Store it immediately!
- **Email Privacy**: Users can choose to hide their email. Apple will provide a relay email like `xyz@privaterelay.appleid.com`
- **Testing**: Use a real Apple ID for testing. Sandbox accounts don't work well with web Sign In with Apple
- **Production**: Ensure all domains are verified and added to the Services ID configuration

## Troubleshooting

### "Invalid client" error
- Verify your Services ID is correct
- Check that domains are properly configured
- Ensure return URLs match exactly

### "Popup blocked" error
- User needs to allow popups for your site
- Consider using redirect flow instead of popup

### "Domain not verified" error
- Upload the verification file to `.well-known/` directory
- Wait a few minutes for Apple to verify

### No user info received
- This is normal after first sign-in
- Apple only sends user info once
- Store it in your database on first authentication

## Security Best Practices

1. **Never expose private key**: Keep it in environment variables only
2. **Validate tokens**: Always verify Apple ID tokens on the backend
3. **Use HTTPS**: Apple Sign-In requires secure connections
4. **Handle email relay**: Support Apple's private relay emails
5. **Store user data**: Save user info on first sign-in (Apple won't send it again)

## Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Sign In with Apple JS](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js)
- [Best Practices](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
