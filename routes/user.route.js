

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { redirectIfLoggedIn, isAuthenticated } = require('./middleware/auth');

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
        allowed_formats: ['jpg', 'png', 'pdf']
    },
});

const upload = multer({ storage: storage });

router.get('/register', redirectIfLoggedIn, (req, res) => { 
    res.render('register');
});

router.post('/register', 
   body('email').trim().isEmail().isLength({ min: 13 }),
   body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3 }), 
      async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
               return res.status(400).json({
                errors: errors.array(),
               message: 'Invalid data'});
            }
               const { username, email, password } = req.body;
               const hashPassword = await bcrypt.hash(password, 10);
               const newUser = await userModel.create({ username, email ,password: hashPassword});
            
               console.log('New user created:', newUser.username);
               res.clearCookie('token');
               res.status(201).json({ 
                   message: 'User registered successfully',
                   username: newUser.username 
               });
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Username or email already exists' });
            }
            next(error);
        }
})

router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.render('login');
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

router.post('/upload', isAuthenticated, upload.single('file'), async (req, res, next) => {
    try {
        console.log('Upload attempt - req.file:', req.file);
        
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await userModel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let files = [];
        if (Array.isArray(user.file)) {
            files = user.file;
        } else if (user.file) {
            files = [user.file];
        }

        console.log('Adding file public_id:', req.file.filename || req.file.public_id);
        files.push(req.file.filename || req.file.public_id); // Save the Cloudinary public_id

        await userModel.updateOne({ _id: user._id }, { $set: { file: files } });
        console.log('File saved to user:', user.username);

        res.redirect('/home?upload=success');
    } catch (error) {
        console.error('Upload error:', error);
        next(error);
    }
});

router.post('/delete-file', isAuthenticated, async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { filename } = req.body; // filename is the public_id
        if (!filename) {
            return res.status(400).json({ message: 'Filename is required' });
        }

        // Remove file from database
        await userModel.updateOne({ _id: user._id }, { $pull: { file: filename } });

        // Delete from Cloudinary
        cloudinary.uploader.destroy(filename, (error, result) => {
            if (error) {
                return next(error);
            }
            res.redirect('/home?delete=success');
        });

    } catch (error) {
        next(error);
    }
});

// Forgot Password Routes
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// GET - Show forgot password form
router.get('/forgot-password', redirectIfLoggedIn, (req, res) => {
    res.render('forgot-password');
});

// POST - Process forgot password request
router.post('/forgot-password', 
    body('email').trim().isEmail(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('forgot-password', { 
                    error: 'Please enter a valid email address' 
                });
            }

            const { email } = req.body;
            const user = await userModel.findOne({ email: email.toLowerCase() });

            // Always show success message (don't reveal if email exists)
            if (!user) {
                return res.render('forgot-password', { 
                    success: 'If an account with this email exists, you will receive a password reset link.' 
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

            // Save reset token to user
            await userModel.updateOne(
                { _id: user._id },
                {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: resetTokenExpiry
                }
            );

            // Send email (only if email service is configured)
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.username);
                if (!emailSent) {
                    console.error('Failed to send password reset email');
                }
            } else {
                console.log(`Password reset link for ${user.username}: http://localhost:3000/user/reset-password/${resetToken}`);
            }

            res.render('forgot-password', { 
                success: 'If an account with this email exists, you will receive a password reset link.' 
            });

        } catch (error) {
            console.error('Forgot password error:', error);
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

module.exports = router;