const dotenv = require('dotenv');
dotenv.config(); // This must be at the top

// Environment variable check
const requiredEnv = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];
requiredEnv.forEach(v => {
    if (!process.env[v]) {
        throw new Error(`FATAL ERROR: Environment variable ${v} is not defined.`);
    }
});

const express = require('express');
const path = require('path');
const session = require('express-session');
const userRouter = require('./routes/user.route');
const adminRouter = require('./routes/admin.routes');
const connectToDB = require('./routes/config/db');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index.routes');
const debugRouter = require('./routes/debug.routes');

// Connect to MongoDB
(async () => {
  try {
    await connectToDB();
  } catch (error) {
    console.error("Failed to connect to the database. The application will not start.", error);
    process.exit(1);
  }
})();

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
    next();
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