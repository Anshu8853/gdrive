const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, trim: true,lowercase: true, unique: true , minlength:[3,'Username must be at least 3 characters long']},
    email: { type: String, trim: true, lowercase: true, unique: true ,minlength:[13,'Email must be at least 13 characters long']}, 
    password: { type: String, trim: true,minlength:[8,'Password must be at least 8 characters long']},
    file: { type: [{ type: String }], default: [] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.model('user', userSchema);

module.exports = User;