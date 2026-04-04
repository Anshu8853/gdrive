const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const { isAuthenticated } = require('./middleware/auth');

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/home', isAuthenticated, async (req, res, next) => {
    try {
        console.log('📍 /home route - user ID from token:', req.user.userId);
        
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            console.log('❌ User not found in database, clearing cookie and redirecting to login');
            res.clearCookie('token');
            return res.redirect('/user/login');
        }

        console.log('✅ User found:', user.username);

        // Handle success message from upload
        let success = null;
        let error = null;

        if (req.query.upload === 'success') {
            success = 'File uploaded successfully!';
        }
        if (req.query.delete === 'success') {
            success = 'File deleted successfully!';
        }
        if (req.query.error) {
            error = req.query.error;
        }

        // Map file array to files for template consistency
        user.files = user.file || [];

        console.log('✅ Rendering home with user:', user.username);
        res.render('home', {
            user,
            success,
            error,
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        console.error('💥 Home route error:', error.message);
        console.error('Stack:', error.stack);
        res.clearCookie('token');
        res.redirect('/user/login?error=' + encodeURIComponent(error.message));
    }
});

module.exports = router;