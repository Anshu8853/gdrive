const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') {
                req.user = decoded;
                return next();
            }
        } catch (error) {
            // Fall through to redirect
        }
    }
    res.redirect('/home'); // Or show an unauthorized page
};

router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const users = await userModel.find({});
        res.render('admin-dashboard', { 
            users, 
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching users');
    }
});

module.exports = router;