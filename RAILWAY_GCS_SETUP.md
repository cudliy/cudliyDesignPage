# Railway + Google Cloud Storage Setup 🚀

## ✅ **Current Status**
- ✅ Service account key is working locally
- ✅ Key file is protected from Git (in .gitignore)
- ✅ Bucket access is working
- ❌ Railway deployment needs environment variables

## 🔧 **Step 1: Fix Google Cloud Bucket**

### **Bucket Setup (Already Complete)**
- ✅ Bucket name: `cudliy-image`
- ✅ Bucket is public and accessible
- ✅ Service account has proper permissions

## 🔧 **Step 2: Set Up Railway Environment Variables**

### **In Railway Dashboard:**
1. Go to your **backend service** in Railway
2. Click **"Variables"** tab
3. **Add these environment variables**:

```
GOOGLE_CLOUD_PROJECT_ID = cudliy
GOOGLE_CLOUD_BUCKET_NAME = cudliy-image
GOOGLE_APPLICATION_CREDENTIALS = {paste your entire JSON key here}
```

### **For GOOGLE_APPLICATION_CREDENTIALS:**
Copy the **entire content** of your `service-account.json` file and paste it as the value.

**Important**: Make sure to paste the complete JSON object including all the fields like `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, etc.

## 🔧 **Step 3: Railway CLI Commands**

Alternatively, use Railway CLI:

```bash
railway variables set GOOGLE_CLOUD_PROJECT_ID=cudliy
railway variables set GOOGLE_CLOUD_BUCKET_NAME=cudliy-image
railway variables set GOOGLE_APPLICATION_CREDENTIALS='{paste your JSON key here}'
```

## 🧪 **Step 4: Test the Setup**

### **Local Test:**
```bash
cd backend
node test-gcs-connection.js
```

You should see:
```
✅ Storage client initialized successfully
✅ Bucket exists and is accessible
✅ Test file uploaded successfully
🎉 Google Cloud Storage is working correctly!
```

### **After Railway Deployment:**
1. **Deploy your backend** to Railway
2. **Test image generation** - images should save to GCS
3. **Test 3D model generation** - models should save to GCS
4. **Check your bucket** - you should see files being uploaded

## 🔒 **Security Notes**

- ✅ **Key file is protected** from Git (keys/ in .gitignore)
- ✅ **Railway uses environment variables** (secure)
- ✅ **Bucket can be public** for file downloads
- ✅ **Service account has minimal required permissions**

## 🚀 **What Will Happen After Setup**

1. **Images generated** → Automatically saved to GCS
2. **3D models generated** → Automatically saved to GCS
3. **Files publicly accessible** → Direct download links
4. **Download button works** → Downloads from GCS
5. **No more storage issues** → Reliable cloud storage

## 📞 **Need Help?**

If you're still having issues:

1. **Check bucket exists**: Go to Cloud Storage in Google Console
2. **Verify permissions**: Check IAM roles for your service account
3. **Test locally first**: Run the test script before deploying
4. **Check Railway logs**: Look for GCS errors in deployment logs

The setup is almost complete! Just need to add the environment variables to Railway.
