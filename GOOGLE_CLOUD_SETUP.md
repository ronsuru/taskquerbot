# 🔧 Google Cloud Storage Setup for TaskBot

## 📋 Prerequisites Completed
- ✅ Google Cloud Project created
- ✅ Required APIs enabled
- ✅ Service account created with proper permissions
- ✅ Storage bucket created

## 🔐 Authentication Setup

### Method 1: Service Account Key File (Recommended for Development)

1. **Place the downloaded JSON key file** in your project root directory
2. **Rename it** to `service-account-key.json`
3. **Add to .env file**:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   ```

### Method 2: Environment Variable (Recommended for Production)

1. **Copy the entire JSON content** from your service account key file
2. **Add to .env file**:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   ```

## 📁 Project Structure
```
Taskquer1/
├── service-account-key.json  # Your downloaded key file
├── .env                     # Your environment variables
├── server/
│   └── objectStorage.ts     # Updated to use standard auth
└── ...
```

## 🧪 Testing the Setup

### 1. Create .env file
Create a `.env` file in your project root with:
```bash
# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Other required variables
DATABASE_URL=postgresql://username:password@host:port/database
TON_API_KEY=your-tonapi-key
MNEMONIC_WALLET_KEY="your 24 word mnemonic phrase here"
PORT=5000
NODE_ENV=development
PUBLIC_OBJECT_SEARCH_PATHS=/public,/uploads
```

### 2. Test the connection
Run this command to test your Google Cloud setup:
```bash
npm run dev
```

### 3. Check the logs
Look for any Google Cloud authentication errors in the console output.

## 🔒 Security Best Practices

### For Development:
- ✅ Keep `service-account-key.json` in your project root
- ✅ Add `service-account-key.json` to `.gitignore`
- ✅ Never commit the key file to version control

### For Production:
- ✅ Use environment variables instead of key files
- ✅ Store credentials in your hosting platform's secret management
- ✅ Use least-privilege access (only required permissions)

## 🚀 Deployment Platforms

### Vercel
1. Go to Project Settings → Environment Variables
2. Add:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` = (paste entire JSON)
   - `GOOGLE_CLOUD_PROJECT_ID` = your-project-id

### Railway
1. Go to Project → Variables
2. Add the same variables as above

### DigitalOcean App Platform
1. Go to App Settings → Environment
2. Add the same variables as above

## 🐛 Troubleshooting

### Common Issues:

**1. "Could not load the default credentials"**
- Check that `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify the JSON file is valid
- Ensure the service account has proper permissions

**2. "Project not found"**
- Verify `GOOGLE_CLOUD_PROJECT_ID` is correct
- Check that the project ID matches your Google Cloud project

**3. "Permission denied"**
- Ensure service account has "Storage Admin" role
- Check bucket permissions
- Verify the service account key is for the correct project

**4. "Bucket not found"**
- Verify bucket name is correct
- Check that bucket exists in the specified project
- Ensure bucket is in the correct region

## 📞 Need Help?

If you encounter issues:
1. Check the Google Cloud Console for error details
2. Verify all environment variables are set correctly
3. Test with a simple file upload to confirm connectivity
4. Check the application logs for specific error messages
