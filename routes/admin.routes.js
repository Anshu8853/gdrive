const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const { isAdmin } = require('./middleware/auth');
const cloudinary = require('cloudinary').v2;

router.get('/dashboard', isAdmin, async (req, res, next) => {
    try {
        // Get all users with their files
        const users = await userModel.find({}).sort({ username: 1 });
        
        // Map file property to files for template consistency
        users.forEach(user => {
            user.files = user.file || [];
        });
        
        console.log(`Admin dashboard accessed by user: ${req.user.username}`);
        console.log(`Found ${users.length} users in database`);
        
        res.render('admin-dashboard', { 
            users, 
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME 
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        next(error);
    }
});

// Admin route to delete any user's file
router.post('/delete-user-file', isAdmin, async (req, res, next) => {
    try {
        const { userId, filename } = req.body;
        
        if (!userId || !filename) {
            return res.status(400).json({ message: 'User ID and filename are required' });
        }

        console.log(`Admin ${req.user.username} attempting to delete file ${filename} for user ${userId}`);

        // Remove file from user's database
        await userModel.updateOne({ _id: userId }, { $pull: { file: filename } });

        // Delete from Cloudinary
        cloudinary.uploader.destroy(filename, (error, result) => {
            if (error) {
                console.error('Error deleting from Cloudinary:', error);
                return next(error);
            }
            console.log('File deleted from Cloudinary:', result);
            res.redirect('/admin/dashboard?delete=success');
        });

    } catch (error) {
        console.error('Admin delete file error:', error);
        next(error);
    }
});

module.exports = router;