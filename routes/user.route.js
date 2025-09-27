

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
               message: 'Invalid data '});
            }
               const { username, email, password } = req.body;
               const hashPassword = await bcrypt.hash(password, 10);
               const newUser = await userModel.create({ username, email ,password: hashPassword});
            
              
               res.clearCookie('token');
               res.json(newUser);
        } catch (error) {
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

        files.push(req.file.public_id); // Save the Cloudinary public_id

        await userModel.updateOne({ _id: user._id }, { $set: { file: files } });

        res.redirect('/home?upload=success');
    } catch (error) {
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

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/user/login');
});

module.exports = router;