// Debug route to check environment variables in Vercel
// Add this temporarily to check what Vercel can see

const express = require('express');
const router = express.Router();

// Debug route - REMOVE THIS IN PRODUCTION
router.get('/debug-env', (req, res) => {
    const envCheck = {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasMongoDb: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasEmailFrom: !!process.env.EMAIL_FROM,
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        hasEmailHost: !!process.env.EMAIL_HOST,
        hasEmailPort: !!process.env.EMAIL_PORT,
        emailFromValue: process.env.EMAIL_FROM ? process.env.EMAIL_FROM.substring(0, 10) + '...' : 'NOT SET',
        emailHostValue: process.env.EMAIL_HOST || 'NOT SET',
        emailPortValue: process.env.EMAIL_PORT || 'NOT SET'
    };
    
    res.json(envCheck);
});

module.exports = router;