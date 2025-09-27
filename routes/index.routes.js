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
        res.render('home', { 
            user, 
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME 
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;