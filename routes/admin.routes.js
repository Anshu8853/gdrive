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

// Admin route to delete a user
router.post('/delete-user', isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.body;
        
        console.log('Delete user request - userId:', userId);
        console.log('Delete user request - req.user:', req.user);
        
        if (!userId) {
            return res.redirect('/admin/dashboard?error=User ID is required');
        }

        if (!req.user || !req.user.userId) {
            console.error('Admin user information is missing');
            return res.redirect('/admin/dashboard?error=Admin authentication error');
        }

        console.log(`Admin ${req.user.username} attempting to delete user ${userId}`);

        // Get the user first to check files and prevent admin self-deletion
        const user = await userModel.findById(userId);
        if (!user) {
            return res.redirect('/admin/dashboard?error=User not found');
        }

        // Prevent admin from deleting themselves
        const adminId = req.user.userId.toString ? req.user.userId.toString() : req.user.userId;
        const targetUserId = user._id.toString ? user._id.toString() : user._id;
        
        if (adminId === targetUserId) {
            return res.redirect('/admin/dashboard?error=You cannot delete your own account');
        }

        // Delete all user's files from Cloudinary first
        if (user.file && Array.isArray(user.file) && user.file.length > 0) {
            console.log(`Deleting ${user.file.length} files from Cloudinary for user ${user.username}`);
            
            for (const file of user.file) {
                try {
                    let filename;
                    if (typeof file === 'string') {
                        filename = file;
                    } else if (typeof file === 'object' && file.filename) {
                        filename = file.filename;
                    } else if (typeof file === 'object' && file.publicId) {
                        filename = file.publicId;
                    }
                    
                    if (filename) {
                        await new Promise((resolve, reject) => {
                            cloudinary.uploader.destroy(filename, (error, result) => {
                                if (error) {
                                    console.error(`Error deleting file ${filename} from Cloudinary:`, error);
                                    resolve(); // Continue even if file deletion fails
                                } else {
                                    console.log(`File ${filename} deleted from Cloudinary:`, result);
                                    resolve();
                                }
                            });
                        });
                    }
                } catch (fileError) {
                    console.error('Error deleting individual file:', fileError);
                    // Continue with user deletion even if some files fail to delete
                }
            }
        }

        // Delete the user from database
        await userModel.findByIdAndDelete(userId);
        
        console.log(`User ${user.username} (${userId}) successfully deleted by admin ${req.user.username}`);
        res.redirect('/admin/dashboard?success=User deleted successfully');

    } catch (error) {
        console.error('Admin delete user error:', error);
        res.redirect('/admin/dashboard?error=Failed to delete user: ' + error.message);
    }
});

// Admin route to delete user via DELETE method (for AJAX requests)
router.delete('/delete-user/:userId', isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('DELETE user request - userId:', userId);
        console.log('DELETE user request - req.user:', req.user);
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        if (!req.user || !req.user.userId) {
            console.error('Admin user information is missing');
            return res.status(401).json({ success: false, error: 'Admin authentication error' });
        }

        // Get the user first to check files and prevent admin self-deletion
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent admin from deleting themselves
        const adminId = req.user.userId.toString ? req.user.userId.toString() : req.user.userId;
        const targetUserId = user._id.toString ? user._id.toString() : user._id;
        
        if (adminId === targetUserId) {
            return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
        }

        // Delete all user's files from Cloudinary first
        if (user.file && Array.isArray(user.file) && user.file.length > 0) {
            for (const file of user.file) {
                try {
                    let filename;
                    if (typeof file === 'string') {
                        filename = file;
                    } else if (typeof file === 'object' && file.filename) {
                        filename = file.filename;
                    } else if (typeof file === 'object' && file.publicId) {
                        filename = file.publicId;
                    }
                    
                    if (filename) {
                        await new Promise((resolve, reject) => {
                            cloudinary.uploader.destroy(filename, (error, result) => {
                                if (error) {
                                    console.error(`Error deleting file ${filename} from Cloudinary:`, error);
                                }
                                resolve(); // Continue even if file deletion fails
                            });
                        });
                    }
                } catch (fileError) {
                    console.error('Error deleting individual file:', fileError);
                }
            }
        }

        // Delete the user from database
        await userModel.findByIdAndDelete(userId);
        
        console.log(`User ${user.username} (${userId}) successfully deleted by admin ${req.user.username}`);
        res.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user: ' + error.message });
    }
});

// Admin file serving route for authenticated access
router.get('/file/:userId/:fileId', isAdmin, async (req, res) => {
    try {
        const { userId, fileId } = req.params;
        
        // Find the user and verify the file exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if the file belongs to this user
        const userFile = user.file && user.file.find(file => {
            if (typeof file === 'string') {
                return file === fileId;
            } else if (file.filename) {
                return file.filename === fileId;
            } else if (file.publicId) {
                return file.publicId === fileId;
            }
            return false;
        });
        
        if (!userFile) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Generate Cloudinary URL and redirect
        let fileUrl;
        const extension = userFile.originalName || userFile.originalname ? 
            (userFile.originalName || userFile.originalname).split('.').pop().toLowerCase() : '';
        
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
        console.error('Admin file serving error:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

module.exports = router;