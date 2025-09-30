

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { redirectIfLoggedIn, isAuthenticated } = require('./middleware/auth');
const { sendPasswordResetEmail, sendOTPEmail, validateEmailConfig } = require('../services/emailService');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer storage configuration for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'drive-uploads',
        allowed_formats: [
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg',
            // Videos
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp',
            // Documents
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
            // Archives
            'zip', 'rar', '7z', 'tar', 'gz',
            // Audio
            'mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a',
            // Code files
            'js', 'css', 'html', 'json', 'xml', 'csv',
            // Other
            'epub', 'mobi', 'psd', 'ai', 'sketch'
        ],
        resource_type: 'auto', // This allows different file types
        access_mode: 'public', // Ensure files are publicly accessible
        type: 'upload' // Specify upload type for public access
    },
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos and large files
    },
    fileFilter: (req, file, cb) => {
        console.log('File filter - mimetype:', file.mimetype);
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
            'image/bmp', 'image/tiff', 'image/svg+xml',
            // Videos
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 
            'video/webm', 'video/mkv', 'video/3gpp',
            // Documents
            'application/pdf', 'text/plain', 'application/rtf',
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Archives
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
            'application/x-tar', 'application/gzip',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp4',
            // Code files
            'application/javascript', 'text/css', 'text/html', 'application/json',
            'application/xml', 'text/csv',
            // Other
            'application/epub+zip', 'application/x-mobipocket-ebook',
            'image/vnd.adobe.photoshop', 'application/postscript'
        ];
        
        // Allow all file types for maximum flexibility
        cb(null, true);
        
        // Uncomment below if you want to restrict to specific types
        // if (allowedTypes.includes(file.mimetype)) {
        //     cb(null, true);
        // } else {
        //     cb(new Error(`Invalid file type: ${file.mimetype}. Please contact support if you need this file type supported.`));
        // }
    }
});

router.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register', { step: 1, success: null, error: null });
});// Step 1: Send OTP for registration
router.post('/register/send-otp',
    body('email').trim().isEmail().isLength({ min: 5 }),
    async (req, res) => {
        console.log('=== REGISTRATION OTP REQUEST ===');
        console.log('Request body:', req.body);
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('register', {
                    step: 1,
                    error: 'Please enter a valid email address',
                    success: null
                });
            }

            const { email } = req.body;
            console.log('Registration OTP request for email:', email);

            // Check if email already exists
            const existingUser = await userModel.findOne({ email });
            if (existingUser) {
                console.log('Email already registered:', email);
                return res.render('register', {
                    step: 1,
                    error: 'Email already registered. Please use a different email or login.',
                    success: null,
                    showEmailExistsPopup: true
                });
            }

            // Validate email configuration
            if (!validateEmailConfig()) {
                console.log('❌ Email configuration invalid');
                return res.render('register', {
                    step: 1,
                    error: 'Email service needs configuration. Please contact administrator.',
                    success: null
                });
            }

            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            
            console.log('Generated registration OTP:', otpCode);

            // Store OTP in session for verification
            req.session = req.session || {};
            req.session.registrationOTP = {
                email: email,
                otp: otpCode,
                expires: otpExpires,
                attempts: 0
            };

            // Send OTP email
            console.log('Attempting to send registration OTP email...');
            const emailSent = await sendOTPEmail(email, otpCode, 'registration');
            console.log('Registration OTP email sent status:', emailSent);

            if (emailSent) {
                res.render('register', {
                    step: 2,
                    email: email,
                    success: `OTP sent to ${email}. Please check your email and enter the 6-digit code.`,
                    error: null
                });
            } else {
                res.render('register', {
                    step: 1,
                    error: 'Failed to send OTP email. Please try again.',
                    success: null
                });
            }

        } catch (error) {
            console.error('Registration OTP error:', error);
            res.render('register', {
                step: 1,
                error: 'Failed to send OTP. Please try again.',
                success: null
            });
        }
    }
);

// Step 2: Verify OTP and complete registration
router.post('/register',
    body('email').trim().isEmail().isLength({ min: 5 }),
    body('otp').trim().isLength({ min: 6, max: 6 }),
    body('username').trim().isLength({ min: 3 }),
    body('password')
        .trim()
        .isLength({ min: 8, max: 16 }).withMessage('Password must be between 8-16 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
    async (req, res) => {
        console.log('=== REGISTRATION COMPLETION ===');
        console.log('Request body:', req.body);
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('register', {
                    step: 2,
                    email: req.body.email,
                    error: 'Please check your input: ' + errors.array().map(e => e.msg).join(', '),
                    success: null
                });
            }

            const { email, otp, username, password } = req.body;
            
            // Check session for OTP
            if (!req.session || !req.session.registrationOTP) {
                return res.render('register', {
                    step: 1,
                    error: 'Registration session expired. Please start again.',
                    success: null
                });
            }

            const otpData = req.session.registrationOTP;

            // Verify email matches
            if (otpData.email !== email) {
                return res.render('register', {
                    step: 1,
                    error: 'Email mismatch. Please start again.',
                    success: null
                });
            }

            // Check if OTP expired
            if (new Date() > new Date(otpData.expires)) {
                delete req.session.registrationOTP;
                return res.render('register', {
                    step: 1,
                    error: 'OTP expired. Please request a new one.',
                    success: null
                });
            }

            // Check attempt limits
            if (otpData.attempts >= 3) {
                delete req.session.registrationOTP;
                return res.render('register', {
                    step: 1,
                    error: 'Too many failed attempts. Please start again.',
                    success: null
                });
            }

            // Verify OTP
            if (otpData.otp !== otp) {
                otpData.attempts++;
                const remainingAttempts = 3 - otpData.attempts;
                return res.render('register', {
                    step: 2,
                    email: email,
                    error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
                    success: null
                });
            }

            // Check if username already exists
            const existingUsername = await userModel.findOne({ username });
            if (existingUsername) {
                return res.render('register', {
                    step: 2,
                    email: email,
                    error: 'Username already exists. Please choose a different username.',
                    success: null
                });
            }

            // Check if email already exists (double check)
            const existingEmail = await userModel.findOne({ email });
            if (existingEmail) {
                return res.render('register', {
                    step: 1,
                    error: 'Email already registered. Please use a different email.',
                    success: null
                });
            }

            // Create user account
            const hashPassword = await bcrypt.hash(password, 10);
            const newUser = await userModel.create({
                username,
                email,
                password: hashPassword
            });

            console.log('New user created with OTP verification:', newUser.username);
            
            // Clear session data
            delete req.session.registrationOTP;
            res.clearCookie('token');

            // Redirect to login with success message
            res.redirect('/user/login?success=Account created successfully! Your email has been verified. Please login.');

        } catch (error) {
            console.error('Registration completion error:', error);
            if (error.code === 11000) {
                return res.render('register', {
                    step: 2,
                    email: req.body.email,
                    error: 'Username or email already exists',
                    success: null
                });
            }
            return res.render('register', {
                step: 2,
                email: req.body.email,
                error: 'Registration failed. Please try again.',
                success: null
            });
        }
    }
);

router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    // Handle success message from registration
    let success = null;
    if (req.query.success) {
        success = req.query.success;
    }
    
    res.render('login', { success });
});

router.post('/login', 
      body('username').trim().isLength({ min: 3 }).toLowerCase(),
      body('password').trim().isLength({ min: 5 }),
      async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {   
                return res.render('login', { error: 'Invalid data' });
            }
            const { username, password } = req.body;

            const user = await userModel.findOne({ username });

            if(!user){
                return res.render('login', { error: 'Invalid username or password' });
            }
            const isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch){
                return res.render('login', { error: 'Invalid username or password' });
            }
            const token = jwt.sign({ userId: user._id, username: user.username, email: user.email, role: user.role },
                process.env.JWT_SECRET, { expiresIn: '24h' ,});
            
            res.cookie('token', token);
            res.redirect('/home');
        } catch (error) {
            next(error);
        }
      })

router.post('/upload', isAuthenticated, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.redirect('/home?error=File size too large (max 50MB)');
                }
                return res.redirect('/home?error=Upload error: ' + err.message);
            }
            return res.redirect('/home?error=' + err.message);
        }
        next();
    });
}, async (req, res, next) => {
    try {
        console.log('Upload attempt - req.file:', req.file);
        console.log('User ID:', req.user.userId);
        
        if (!req.file) {
            console.log('No file uploaded - req.file is null/undefined');
            return res.redirect('/home?error=No file selected');
        }

        const user = await userModel.findById(req.user.userId);
        if (!user) {
            console.log('User not found in database');
            return res.redirect('/home?error=User not found');
        }

        let files = [];
        if (Array.isArray(user.file)) {
            files = user.file;
        } else if (user.file) {
            files = [user.file];
        }

        // For Cloudinary, we need to use public_id or filename
        const fileName = req.file.public_id || req.file.filename;
        console.log('File details:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            public_id: req.file.public_id,
            secure_url: req.file.secure_url,
            resource_type: req.file.resource_type,
            url: req.file.url,
            path: req.file.path
        });
        
        // Create file object with more details
        const fileData = {
            filename: fileName,
            originalName: req.file.originalname,
            uploadDate: new Date(),
            cloudinaryUrl: req.file.secure_url || req.file.url || req.file.path,
            publicId: req.file.public_id
        };
        
        files.push(fileData);

        const updateResult = await userModel.updateOne({ _id: user._id }, { $set: { file: files } });
        console.log('Database update result:', updateResult);
        console.log('File saved to user:', user.username);

        res.redirect('/home?upload=success');
    } catch (error) {
        console.error('Upload error details:', error);
        res.redirect('/home?error=Upload failed: ' + error.message);
    }
});

router.post('/delete-file', isAuthenticated, async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            return res.redirect('/home?error=User not found');
        }

        const { filename } = req.body; // filename is the public_id
        if (!filename) {
            return res.redirect('/home?error=Filename is required');
        }

        // Remove file from database - handle both old string format and new object format
        let updatedFiles = [];
        if (user.file && Array.isArray(user.file)) {
            updatedFiles = user.file.filter(file => {
                if (typeof file === 'string') {
                    return file !== filename;
                } else if (typeof file === 'object' && file.filename) {
                    return file.filename !== filename;
                } else if (typeof file === 'object' && file.publicId) {
                    return file.publicId !== filename;
                }
                return true;
            });
        }

        await userModel.updateOne({ _id: user._id }, { $set: { file: updatedFiles } });

        // Delete from Cloudinary - use the filename as public_id
        cloudinary.uploader.destroy(filename, (error, result) => {
            if (error) {
                console.error('Cloudinary delete error:', error);
                return res.redirect('/home?error=Failed to delete file from cloud storage');
            }
            console.log('File deleted from Cloudinary:', result);
            res.redirect('/home?delete=success');
        });

    } catch (error) {
        console.error('Delete file error:', error);
        res.redirect('/home?error=Failed to delete file');
    }
});

// Forgot Password Routes

// GET - Show forgot password form
router.get('/forgot-password', redirectIfLoggedIn, (req, res) => {
    console.log('=== FORGOT PASSWORD GET ROUTE ACCESSED ===');
    console.log('Query params:', req.query);
    
    // Handle success/error messages from query params
    let success = null;
    let error = null;
    
    if (req.query.success) {
        success = req.query.success;
    }
    if (req.query.error) {
        error = req.query.error;
    }
    
    console.log('Rendering forgot-password with:', { success, error });
    res.render('forgot-password', { success, error });
});

// POST - Process forgot password request (Send OTP)
router.post('/forgot-password', 
    body('email').trim().isEmail(),
    async (req, res, next) => {
        console.log('=== FORGOT PASSWORD POST ROUTE ACCESSED ===');
        console.log('Request body:', req.body);
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('Validation errors:', errors.array());
                return res.render('forgot-password', { 
                    error: 'Please enter a valid email address' 
                });
            }

            const { email } = req.body;
            console.log(`OTP request for email: ${email}`);
            
            const user = await userModel.findOne({ email: email.toLowerCase() });
            console.log(`User found:`, user ? `Yes (${user.username})` : 'No');

            // Always show success message (don't reveal if email exists)
            if (!user) {
                console.log('User not found - showing generic success message');
                return res.render('forgot-password', { 
                    success: 'If an account with this email exists, you will receive an OTP code.' 
                });
            }

            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = Date.now() + 600000; // 10 minutes from now

            console.log(`Generated OTP for ${user.username}: ${otpCode}`);

            // Save OTP to user
            await userModel.updateOne(
                { _id: user._id },
                {
                    otpCode: otpCode,
                    otpExpires: otpExpiry,
                    otpAttempts: 0
                }
            );

            // Try to send OTP email
            let otpSent = false;
            let emailConfigured = validateEmailConfig();
            let emailError = null;
            
            if (emailConfigured) {
                try {
                    // Add timeout wrapper for email sending
                    console.log('Attempting to send OTP email...');
                    const emailPromise = sendOTPEmail(user.email, otpCode, user.username);
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Email sending timeout after 20 seconds')), 20000)
                    );
                    
                    otpSent = await Promise.race([emailPromise, timeoutPromise]);
                    console.log('OTP email sent status:', otpSent);
                } catch (error) {
                    console.error('OTP email sending failed:', error.message);
                    emailError = error.message;
                    if (error.message.includes('Invalid login') || error.message.includes('BadCredentials')) {
                        console.log('⚠️ Gmail authentication failed - App Password may need regeneration');
                    }
                    if (error.message.includes('timeout')) {
                        console.log('⚠️ Email sending timed out - proceeding without email');
                    }
                }
            } else {
                console.log('⚠️ Email not configured properly. Please run: node setup-email.js');
            }

            // Show appropriate success message
            if (otpSent) {
                res.render('forgot-password', { 
                    success: 'OTP has been sent to your email address. Please check your inbox and spam folder.',
                    showOtpForm: true,
                    userEmail: email
                });
            } else {
                // Don't proceed to Step 2 if email failed - show error instead
                let errorMessage = '';
                if (!emailConfigured) {
                    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
                    if (isProduction) {
                        errorMessage = 'Email service needs configuration in Vercel dashboard. Please contact administrator.';
                    } else {
                        errorMessage = 'Email service is not configured. Please run: node setup-email.js';
                    }
                } else if (emailError) {
                    if (emailError.includes('Invalid login') || emailError.includes('BadCredentials')) {
                        errorMessage = 'Gmail authentication failed. App Password may be invalid. Please contact administrator.';
                    } else if (emailError.includes('timeout')) {
                        errorMessage = 'Email service is temporarily unavailable. Please try again in a few minutes.';
                    } else {
                        errorMessage = 'Failed to send OTP email: ' + emailError + '. Please try again.';
                    }
                } else {
                    errorMessage = 'Unknown error occurred while sending OTP. Please try again.';
                }
                
                res.render('forgot-password', { 
                    error: errorMessage,
                    success: null,
                    showOtpForm: false
                });
            }

        } catch (error) {
            console.error('Forgot password OTP error:', error);
            next(error);
        }
    }
);

// POST - Verify OTP and reset password
router.post('/verify-otp',
    body('email').trim().isEmail(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMsg = errors.array()[0].msg;
                return res.render('forgot-password', {
                    error: errorMsg,
                    showOtpForm: true,
                    userEmail: req.body.email
                });
            }

            const { email, otp, newPassword } = req.body;
            console.log(`OTP verification for email: ${email}, OTP: ${otp}`);

            const user = await userModel.findOne({ email: email.toLowerCase() });

            if (!user) {
                console.log('User not found during OTP verification');
                return res.render('forgot-password', {
                    error: 'Invalid request',
                    showOtpForm: true,
                    userEmail: email
                });
            }

            // Check if OTP exists and hasn't expired
            if (!user.otpCode || !user.otpExpires) {
                console.log('No OTP found for user');
                return res.render('forgot-password', {
                    error: 'No OTP request found. Please request a new OTP.',
                    userEmail: email
                });
            }

            // Check if OTP has expired
            if (Date.now() > user.otpExpires) {
                console.log('OTP expired');
                await userModel.updateOne(
                    { _id: user._id },
                    { $unset: { otpCode: 1, otpExpires: 1, otpAttempts: 1 } }
                );
                return res.render('forgot-password', {
                    error: 'OTP has expired. Please request a new one.',
                    userEmail: email
                });
            }

            // Check attempt limit
            if (user.otpAttempts >= 5) {
                console.log('Too many OTP attempts');
                await userModel.updateOne(
                    { _id: user._id },
                    { $unset: { otpCode: 1, otpExpires: 1, otpAttempts: 1 } }
                );
                return res.render('forgot-password', {
                    error: 'Too many incorrect attempts. Please request a new OTP.',
                    userEmail: email
                });
            }

            // Verify OTP
            if (user.otpCode !== otp) {
                console.log(`OTP mismatch. Expected: ${user.otpCode}, Got: ${otp}`);
                await userModel.updateOne(
                    { _id: user._id },
                    { $inc: { otpAttempts: 1 } }
                );
                return res.render('forgot-password', {
                    error: `Incorrect OTP. ${5 - (user.otpAttempts + 1)} attempts remaining.`,
                    showOtpForm: true,
                    userEmail: email
                });
            }

            console.log('OTP verified successfully - resetting password');

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear OTP data
            await userModel.updateOne(
                { _id: user._id },
                {
                    password: hashedPassword,
                    $unset: { otpCode: 1, otpExpires: 1, otpAttempts: 1 }
                }
            );

            console.log('Password reset successfully for user:', user.email);

            res.render('forgot-password', {
                success: 'Password has been reset successfully. You can now login with your new password.'
            });

        } catch (error) {
            console.error('OTP verification error:', error);
            next(error);
        }
    }
);

// GET - Show reset password form
router.get('/reset-password/:token', redirectIfLoggedIn, async (req, res, next) => {
    try {
        const { token } = req.params;
        
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('reset-password', { 
                error: 'Password reset token is invalid or has expired.',
                token: null
            });
        }

        res.render('reset-password', { token, error: null });
    } catch (error) {
        console.error('Reset password page error:', error);
        next(error);
    }
});

// POST - Process password reset
router.post('/reset-password/:token',
    body('password').trim().isLength({ min: 8 }),
    body('confirmPassword').trim().isLength({ min: 8 }),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('reset-password', {
                    error: 'Password must be at least 8 characters long.',
                    token: req.params.token
                });
            }

            const { token } = req.params;
            const { password, confirmPassword } = req.body;

            if (password !== confirmPassword) {
                return res.render('reset-password', {
                    error: 'Passwords do not match.',
                    token: token
                });
            }

            const user = await userModel.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.render('reset-password', {
                    error: 'Password reset token is invalid or has expired.',
                    token: null
                });
            }

            // Hash new password
            const hashPassword = await bcrypt.hash(password, 10);

            // Update password and clear reset token
            await userModel.updateOne(
                { _id: user._id },
                {
                    password: hashPassword,
                    $unset: {
                        resetPasswordToken: 1,
                        resetPasswordExpires: 1
                    }
                }
            );

            console.log(`Password reset successful for user: ${user.username}`);
            
            res.render('reset-password', {
                success: 'Your password has been successfully reset! You can now login with your new password.',
                token: null
            });

        } catch (error) {
            console.error('Reset password error:', error);
            next(error);
        }
    }
);

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/user/login');
});

// File serving route for authenticated access
router.get('/file/:fileId', isAuthenticated, async (req, res) => {
    try {
        let { fileId } = req.params;
        const userId = req.user.userId;
        
        // Handle fileId that might include folder prefix (e.g., "drive-uploads/filename")
        if (fileId.includes('/')) {
            fileId = fileId.split('/').pop(); // Get just the filename part
        }
        
        // Find the user and verify they own this file
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if the file belongs to this user
        const userFile = user.file && user.file.find(file => {
            if (typeof file === 'string') {
                return file === fileId || file.includes(fileId);
            } else if (file.filename) {
                return file.filename === fileId || file.filename.includes(fileId);
            } else if (file.publicId) {
                return file.publicId === fileId || file.publicId.includes(fileId);
            }
            return false;
        });
        
        if (!userFile) {
            return res.status(403).json({ error: 'File not found or access denied' });
        }
        
        // Generate Cloudinary URL and redirect
        let fileUrl;
        const extension = userFile.originalName ? userFile.originalName.split('.').pop().toLowerCase() : '';
        
        if (typeof userFile === 'string') {
            fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${userFile}`;
        } else if (userFile.cloudinaryUrl) {
            fileUrl = userFile.cloudinaryUrl;
        } else {
            let resourceType;
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'].includes(extension)) {
                resourceType = 'image';
            } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'].includes(extension)) {
                resourceType = 'video';
            } else {
                resourceType = 'raw';
            }
            
            const publicId = userFile.filename || userFile.publicId;
            fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${publicId}`;
        }
        
        // Redirect to the Cloudinary URL
        res.redirect(fileUrl);
        
    } catch (error) {
        console.error('File serving error:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// Alternative route to handle full path format (folder/filename)
router.get('/file/:folder/:filename', isAuthenticated, async (req, res) => {
    try {
        const { filename } = req.params;
        const userId = req.user.userId;
        
        // Find the user and verify they own this file
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if the file belongs to this user
        const userFile = user.file && user.file.find(file => {
            if (typeof file === 'string') {
                return file === filename || file.includes(filename);
            } else if (file.filename) {
                return file.filename === filename || file.filename.includes(filename);
            } else if (file.publicId) {
                return file.publicId === filename || file.publicId.includes(filename);
            }
            return false;
        });
        
        if (!userFile) {
            return res.status(403).json({ error: 'File not found or access denied' });
        }
        
        // Generate Cloudinary URL and redirect
        let fileUrl;
        const extension = userFile.originalName ? userFile.originalName.split('.').pop().toLowerCase() : '';
        
        if (typeof userFile === 'string') {
            fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${userFile}`;
        } else if (userFile.cloudinaryUrl) {
            fileUrl = userFile.cloudinaryUrl;
        } else {
            let resourceType;
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'].includes(extension)) {
                resourceType = 'image';
            } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'].includes(extension)) {
                resourceType = 'video';
            } else {
                resourceType = 'raw';
            }
            
            const publicId = userFile.filename || userFile.publicId;
            fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${publicId}`;
        }
        
        // Redirect to the Cloudinary URL
        res.redirect(fileUrl);
        
    } catch (error) {
        console.error('File serving error:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

module.exports = router;