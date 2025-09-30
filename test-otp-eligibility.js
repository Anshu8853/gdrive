// Test OTP system with registered users
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');

async function testRegisteredUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        console.log('📋 Testing OTP eligibility for registered users:\n');
        
        // Test specific registered emails
        const testEmails = [
            'anshulverma2003lmp@gmail.com',
            'chawdharirohit58@gmail.com', 
            '22bcs11915@cuchd.in',
            'anshulpatel684@gmail.com',
            '22bcs10092@cuchd.in'
        ];
        
        for (const email of testEmails) {
            const user = await userModel.findOne({ email: email });
            if (user) {
                console.log(`✅ ${email}`);
                console.log(`   → Username: ${user.username}`);
                console.log(`   → Should receive OTP: YES\n`);
            } else {
                console.log(`❌ ${email}`);
                console.log(`   → User not found in database`);
                console.log(`   → Should receive OTP: NO\n`);
            }
        }
        
        // Test email configuration
        console.log('📧 Email Service Status:');
        const { validateEmailConfig } = require('./services/emailService');
        const isConfigured = validateEmailConfig();
        console.log(`Email configured: ${isConfigured ? '✅ YES' : '❌ NO'}\n`);
        
        if (isConfigured) {
            console.log('🎯 Ready to test! Try these emails that should work:');
            const validUsers = await userModel.find({}, { email: 1, username: 1 });
            validUsers.forEach(user => {
                console.log(`   • ${user.email} (${user.username})`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testRegisteredUsers();