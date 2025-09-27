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
        
        // Handle success/error messages
        let success = null;
        let error = null;
        
        if (req.query.delete === 'success') {
            success = 'File deleted successfully!';
        }
        if (req.query.error) {
            error = req.query.error;
        }
        
        res.render('admin-dashboard', { 
            users, 
            success,
            error,
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
        console.log('Admin delete request body:', req.body);
        const { userId, filename } = req.body;
        
        console.log('Extracted values:', { userId, filename });
        
        if (!userId || !filename) {
            console.log('Delete validation error: Missing userId or filename');
            console.log('userId:', userId, 'filename:', filename);
            return res.redirect('/admin/dashboard?error=User ID and filename are required');
        }

        console.log(`Admin ${req.user.username} attempting to delete file ${filename} for user ${userId}`);

        // Get the user first to check file format
        const user = await userModel.findById(userId);
        if (!user) {
            return res.redirect('/admin/dashboard?error=User not found');
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

        await userModel.updateOne({ _id: userId }, { $set: { file: updatedFiles } });

        // Delete from Cloudinary
        cloudinary.uploader.destroy(filename, (error, result) => {
            if (error) {
                console.error('Error deleting from Cloudinary:', error);
                return res.redirect('/admin/dashboard?error=Failed to delete file from cloud storage');
            }
            console.log('File deleted from Cloudinary:', result);
            res.redirect('/admin/dashboard?delete=success');
        });

    } catch (error) {
        console.error('Admin delete file error:', error);
        res.redirect('/admin/dashboard?error=Failed to delete file: ' + error.message);
    }
});

module.exports = router;