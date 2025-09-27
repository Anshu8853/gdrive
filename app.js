const dotenv = require('dotenv');
dotenv.config(); // This must be at the top

const express = require('express');
const userRouter = require('./routes/user.route');
const adminRouter = require('./routes/admin.routes');
const connectToDB = require('./routes/config/db');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index.routes');
const multer = require('multer');

// Connect to MongoDB
connectToDB();

const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);

// Export the app for Vercel
module.exports = app;