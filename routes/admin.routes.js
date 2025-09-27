const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const { isAdmin } = require('./middleware/auth');

router.get('/dashboard', isAdmin, async (req, res, next) => {
    try {
        const users = await userModel.find({});
        res.render('admin-dashboard', { 
            users, 
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME 
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;