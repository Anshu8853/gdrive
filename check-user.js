const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        const email = 'anshulverma2003lmp@gmail.com';
        const user = await userModel.findOne({ email: email });
        
        if (user) {
            console.log('✅ User found:', {
                username: user.username,
                email: user.email,
                hasOTP: !!user.otpCode,
                otpExpires: user.otpExpires
            });
        } else {
            console.log('❌ No user found with email:', email);
            
            // Check for similar emails
            const allUsers = await userModel.find({}, { email: 1, username: 1 });
            console.log('Available users:');
            allUsers.forEach(u => console.log(`- ${u.username}: ${u.email}`));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();