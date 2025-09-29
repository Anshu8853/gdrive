# 🔧 Gmail App Password Setup Guide

## The Issue

Your Gmail App Password authentication is failing. This is a common issue that can be resolved by generating a new App Password.

## Step-by-Step Solution

### 1. Go to Google Account Settings

- Open your browser and go to [myaccount.google.com](https://myaccount.google.com)
- Sign in with your Gmail account: `anshulverma2003lmp2@gmail.com`

### 2. Navigate to Security Settings

- Click on **"Security"** in the left sidebar
- Scroll down to **"Signing in to Google"**

### 3. Enable 2-Step Verification (if not already enabled)

- Click on **"2-Step Verification"**
- Follow the setup process if it's not already enabled
- **This is required** for App Passwords to work

### 4. Generate New App Password

- In the Security section, click on **"App passwords"**
- You might need to sign in again
- Click **"Generate"** or **"Create app password"**
- Select **"Mail"** as the app type
- Give it a name like "GDrive OTP System"
- Copy the generated 16-character password

### 5. Update Your .env File

Replace the current `EMAIL_PASS` value in your `.env` file:

```
EMAIL_PASS=your-new-16-character-password
```

**Important**:

- Remove any spaces or dashes from the password
- It should be exactly 16 characters
- Use only letters and numbers

### 6. Test the Configuration

Run this command to test:

```bash
node setup-email.js
```

### 7. Restart Your Server

```bash
npm start
```

## Common Issues & Solutions

### Issue: "App passwords" option not visible

**Solution**: Make sure 2-Step Verification is enabled first.

### Issue: Still getting authentication errors

**Solutions**:

1. Make sure you're using the exact Gmail address that generated the App Password
2. Try deleting old App Passwords and creating a new one
3. Check that the Gmail account doesn't have any security restrictions

### Issue: 2-Step Verification setup problems

**Solution**: Use Google Authenticator app or SMS verification as backup methods.

## Testing Commands

After updating the App Password, run these tests:

```bash
# Test email configuration
node setup-email.js

# Test sending actual OTP
# Go to http://localhost:3000/user/forgot-password and try submitting your email
```

## Expected Result

✅ OTP emails will be sent to your Gmail inbox
✅ No more "Email service not configured" messages
✅ Professional OTP email templates with your branding

---

**Need Help?** If you continue to have issues, the system will still work by displaying OTP codes on screen as a fallback.
