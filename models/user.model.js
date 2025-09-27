const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    cloudinaryUrl: { type: String },
    publicId: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: { type: String, trim: true,lowercase: true, unique: true , minlength:[3,'Username must be at least 3 characters long']},
    email: { type: String, trim: true, lowercase: true, unique: true ,minlength:[13,'Email must be at least 13 characters long']}, 
    password: { type: String, trim: true,minlength:[8,'Password must be at least 8 characters long']},
    file: { type: [fileSchema], default: [] }, // Updated to support file objects
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

const User = mongoose.model('user', userSchema);

module.exports = User;