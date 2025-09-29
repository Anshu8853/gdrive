# Vercel Deployment Fix for Email Service

## Problem

The email service works on localhost but shows "Email service not configured" on Vercel.

## Root Cause

Vercel doesn't have access to your local `.env` file. Environment variables need to be set in Vercel dashboard.

## Solution

### 1. Go to Vercel Dashboard

- Visit: https://vercel.com/dashboard
- Find your `gdrive` project
- Click on your project

### 2. Add Environment Variables

Go to **Settings** → **Environment Variables** and add these:

```
EMAIL_FROM=anshulverma2003lmp@gmail.com
EMAIL_USER=anshulverma2003lmp@gmail.com
EMAIL_PASS=uhfoqelijnimvsii
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Redeploy

After adding environment variables, redeploy your project:

- Go to **Deployments** tab
- Click the three dots (...) on the latest deployment
- Click **Redeploy**

### 4. Alternative: Add via Vercel CLI

If you have Vercel CLI installed:

```bash
vercel env add EMAIL_FROM
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add EMAIL_HOST
vercel env add EMAIL_PORT
```

## Important Notes

1. **Never commit .env to Git** - It's correctly ignored
2. **Environment variables are case-sensitive**
3. **Each variable must be added separately in Vercel**
4. **Redeploy after adding variables**

## Testing

After deployment:

1. Visit your Vercel URL
2. Go to forgot password
3. Enter email
4. Should now send OTP to email instead of showing on screen

## Backup Plan

If you prefer not to add email credentials to Vercel, the fallback system will continue to work by displaying OTP codes on screen.
