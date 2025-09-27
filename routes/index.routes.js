const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.redirect('/user/register');
        }
    } else {
        res.redirect('/user/register');
    }
};

router.get('/', (req, res) => {
    res.render('register');
});

router.get('/home', isAuthenticated, async (req, res) => {
    const user = await userModel.findById(req.user.userId);
    res.render('home', { 
        user, 
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME 
    });
});

module.exports = router;