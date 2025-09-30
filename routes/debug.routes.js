// Debug route to check environment variables in Vercel
// Add this temporarily to check what Vercel can see

const express = require('express');
const router = express.Router();

// Debug route - REMOVE THIS IN PRODUCTION
router.get('/debug-env', (req, res) => {
    const envCheck = {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        totalEnvVars: Object.keys(process.env).length,
        
        // Check each required variable individually
        EMAIL_FROM: {
            exists: !!process.env.EMAIL_FROM,
            value: process.env.EMAIL_FROM ? process.env.EMAIL_FROM.substring(0, 10) + '...' : 'NOT SET',
            length: process.env.EMAIL_FROM ? process.env.EMAIL_FROM.length : 0
        },
        EMAIL_USER: {
            exists: !!process.env.EMAIL_USER,
            value: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 10) + '...' : 'NOT SET',
            length: process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 0
        },
        EMAIL_PASS: {
            exists: !!process.env.EMAIL_PASS,
            value: process.env.EMAIL_PASS ? '[HIDDEN - LENGTH: ' + process.env.EMAIL_PASS.length + ']' : 'NOT SET',
            length: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
        },
        EMAIL_HOST: {
            exists: !!process.env.EMAIL_HOST,
            value: process.env.EMAIL_HOST || 'NOT SET'
        },
        EMAIL_PORT: {
            exists: !!process.env.EMAIL_PORT,
            value: process.env.EMAIL_PORT || 'NOT SET'
        },
        
        // Other important vars
        hasMongoDb: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        
        // Validation result
        emailConfigValid: require('../services/emailService').validateEmailConfig()
    };
    
    res.json(envCheck);
});

module.exports = router;