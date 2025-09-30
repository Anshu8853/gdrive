// Test sending OTP to multiple email addresses
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');
const { sendOTPEmail } = require('./services/emailService');

async function testMultipleEmails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        // Get all users from database
        const users = await userModel.find({}, { email: 1, username: 1 });
        console.log('📋 Available users in database:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username}: ${user.email}`);
        });
        
        console.log('\n🧪 Testing email sending to different addresses...');
        
        // Test emails
        const testEmails = [
            { email: 'anshulverma2003lmp@gmail.com', username: 'anshul_test' },
            { email: '22bcs11915@cuchd.in', username: 'student_test' },
            { email: 'chawdharirohit58@gmail.com', username: 'rohit_test' }
        ];
        
        for (const testUser of testEmails) {
            console.log(`\n📧 Testing email to: ${testUser.email}`);
            try {
                const result = await sendOTPEmail(testUser.email, '123456', testUser.username);
                console.log(`✅ Result: ${result ? 'SUCCESS' : 'FAILED'}`);
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testMultipleEmails();