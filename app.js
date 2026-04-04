const dotenv = require('dotenv');
dotenv.config(); // This must be at the top

// Environment variable check with graceful logging
const requiredEnv = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];
const missingEnv = [];
requiredEnv.forEach(v => {
    if (!process.env[v]) {
        missingEnv.push(v);
        console.warn(`⚠️  WARNING: Environment variable ${v} is not defined.`);
    }
});
if (missingEnv.length > 0) {
    console.error(`\n❌ CRITICAL: Missing ${missingEnv.length} required environment variable(s): ${missingEnv.join(', ')}`);
    console.error('\n📋 Add these to Vercel dashboard:');
    missingEnv.forEach(v => console.error(`   - ${v}`));
    console.error('\n⏱️  App will attempt to continue for 30 seconds, then exit.\n');
    
    // Graceful timeout to allow Vercel to capture logs
    setTimeout(() => {
        console.error('❌ Exiting due to missing environment variables.');
        process.exit(1);
    }, 30000);
}

const express = require('express');
const path = require('path');
const session = require('express-session');
const userRouter = require('./routes/user.route');
const adminRouter = require('./routes/admin.routes');
const connectToDB = require('./routes/config/db');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index.routes');
const debugRouter = require('./routes/debug.routes');

// Track connection status
let dbConnected = false;

// Connect to MongoDB (non-blocking - will retry on first request)
connectToDB()
  .then(() => {
    dbConnected = true;
    console.log('✅ MongoDB connected on startup');
  })
  .catch(error => {
    console.warn('⚠️  MongoDB connection failed on startup, will retry on first request:', error.message);
    // Don't crash - try again when first request comes in
  });

const app = express();

// Set proper charset and headers
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

// Set views path for Vercel
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());

// Session configuration for OTP storage
app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 15 * 60 * 1000 // 15 minutes
    }
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Retry MongoDB connection if not connected
    if (!dbConnected && req.path !== '/debug') {
        connectToDB()
          .then(() => {
            dbConnected = true;
            console.log('✅ MongoDB connected on request');
            next();
          })
          .catch(error => {
            console.error('❌ MongoDB still not connected:', error.message);
            // Continue anyway - some routes might not need DB
            next();
          });
    } else {
        next();
    }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Note: Static uploads folder not needed since using Cloudinary

// Serve test files (for development)
app.use('/test', express.static(__dirname));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/debug', debugRouter);

// Centralized error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Export the app for Vercel
module.exports = app;