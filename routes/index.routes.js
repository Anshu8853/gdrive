const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const { isAuthenticated } = require('./middleware/auth');

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/home', isAuthenticated, async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            console.log('User not found, clearing cookie and redirecting to login');
            res.clearCookie('token');
            return res.redirect('/user/login');
        }
        res.render('home', { 
            user, 
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME 
        });
    } catch (error) {
        console.error('Home route error:', error);
        res.clearCookie('token');
        res.redirect('/user/login');
    }
});

module.exports = router;