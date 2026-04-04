# 🚀 Vercel Deployment - Complete Troubleshooting Guide

## ✅ What Was Fixed

Your 500 error was caused by **missing environment variables**. We've updated:

1. ✅ `vercel.json` - Now uses proper api/ directory routing
2. ✅ `app.js` - Graceful error handling (won't crash immediately)
3. ✅ `api/index.js` - Created new Vercel serverless entry point
4. ✅ `.env.example` - Template for all required variables

---

## 🔧 Required Steps to Fix Your Deployment

### **Step 1: Add Environment Variables to Vercel Dashboard**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add each required variable:**

```
MONGODB_URI = [Your MongoDB connection string]
JWT_SECRET = [Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
CLOUDINARY_CLOUD_NAME = [Your Cloudinary cloud name]
CLOUDINARY_API_KEY = [Your Cloudinary API key]
CLOUDINARY_API_SECRET = [Your Cloudinary API secret]
```

3. **Optional - Add if using email verification:**

```
EMAIL_USER = your-gmail@gmail.com
EMAIL_PASS = [16-character Gmail App Password]
EMAIL_FROM = your-gmail@gmail.com
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
```

4. **Save and set scope to: Production, Preview, Development**

### **Step 2: Generate JWT_SECRET Locally**

Run this in PowerShell to generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste into Vercel environment variables.

### **Step 3: Verify MongoDB Connection**

1. Make sure your MongoDB URI is correct:
   - Should be: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
   - Test locally first: Create `.env` file with this URI
   - Run: `npm start`
   - If it works locally, it should work on Vercel

2. **Common MongoDB Issues:**
   - ❌ IP whitelist: Allow **Vercel's IPs** in MongoDB Atlas network access
   - ❌ Old connection string: Copy fresh from MongoDB Atlas
   - ❌ Special characters in password: URL-encode them (@ → %40, etc.)

### **Step 4: Get Cloudinary Credentials**

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console/settings/api)
2. Copy:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. Add them all to Vercel environment variables

### **Step 5: Redeploy**

1. In Vercel dashboard: **Deployments** → **Redeploy** (or push to GitHub)
2. Wait 3-5 minutes for deployment
3. Check URL - should show your app (no more 500 error)

---

## 🧪 Testing Your Deployment

### **Test 1: Check if app loads**

```bash
# In terminal
curl https://your-vercel-url.vercel.app/
```

Should return HTML, not 500 error.

### **Test 2: Check environment variables are loaded**

```bash
# In terminal
curl https://your-vercel-url.vercel.app/debug/env-raw
```

You should see your environment variable names (values hidden for security).

### **Test 3: Try login page**

Visit: `https://your-vercel-url.vercel.app/user/login`

Should show login form, not error.

---

## 🚨 If You Still Get 500 Error

### **Check Vercel Logs:**

1. Go to Vercel Dashboard → Your Project → **Function Logs**
2. Look for error messages like:
   - `FATAL: Missing ... environment variable` → Add to Vercel env vars
   - `Could not connect to MongoDB` → Check MongoDB URI
   - Module not found → Run `npm install` locally, commit, redeploy

### **Quick Debugging Steps:**

1. **Local test first:**

```bash
cd E:\gdrive\gdrive
npm install
# Create .env file with your environment variables
npm start
# Visit http://localhost:3000
```

If it works locally, the issue is Vercel environment variables.

2. **Check node_modules is not in .gitignore:**

```bash
cat .gitignore
```

Should NOT have `node_modules` in it (Vercel installs dependencies automatically)

3. **Force redeploy:**

```bash
# Push a small change to GitHub
echo "# Updated" >> README.md
git add -A
git commit -m "Trigger redeploy"
git push
```

---

## 📋 Checklist Before Next Deployment

- [ ] All 5 required environment variables added to Vercel
- [ ] MongoDB connection string verified in Vercel
- [ ] Cloudinary credentials added to Vercel
- [ ] `.env.example` file created locally
- [ ] Local test works: `npm start`
- [ ] `api/index.js` file exists in project
- [ ] `vercel.json` updated with new config

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**

1. **Never commit .env file** (it contains secrets) - Make sure .gitignore includes:
   ```
   .env
   .env.local
   .env.vercel
   node_modules/
   ```

2. **Never share environment variable values** - They contain API keys and passwords

3. **Rotate Gmail App Password** if exposed - Current one in docs is compromised

4. **Change JWT_SECRET** regularly - Generate new one periodically

---

## 📚 Useful Commands

```bash
# Generate new JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test MongoDB connection locally
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db"

# Check what env vars are available
echo $env:MONGODB_URI  # PowerShell
echo $MONGODB_URI       # Bash

# Redeploy manually
vercel --prod

# View Vercel logs in real-time
vercel logs
```

---

## ✅ Expected Result

After completing all steps:

1. ✅ No more 500 errors
2. ✅ Login page loads
3. ✅ Users can register/login
4. ✅ Files can be uploaded
5. ✅ Admin dashboard accessible

If you still have issues, check the Vercel Function Logs for the specific error message.
