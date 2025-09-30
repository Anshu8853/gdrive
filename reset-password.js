// Check all users and reset anshul's password
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');
const bcrypt = require('bcrypt');

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        // Show all users
        const users = await userModel.find({}, { username: 1, email: 1 });
        console.log('📋 All users in database:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. Username: ${user.username}, Email: ${user.email}`);
        });
        
        // Reset anshul's password to something simple
        const newPassword = 'anshul';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await userModel.updateOne(
            { username: 'anshul' },
            { password: hashedPassword }
        );
        
        if (result.modifiedCount > 0) {
            console.log('\n✅ Password reset successful!');
            console.log('Username: anshul');
            console.log('New Password: anshul');
            console.log('\n🎯 You can now login with:');
            console.log('Username: anshul');
            console.log('Password: anshul');
        } else {
            console.log('❌ Password reset failed');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetPassword();