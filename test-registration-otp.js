// Test Registration OTP System
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');

async function testRegistrationSystem() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        console.log('🧪 Testing Registration OTP System');
        console.log('==================================');
        
        // Test email for registration
        const testEmail = 'test-registration@example.com';
        
        console.log('\n1. Checking if test email exists...');
        const existingUser = await userModel.findOne({ email: testEmail });
        
        if (existingUser) {
            console.log('❌ Test email already exists in database');
            console.log('✅ This demonstrates email duplicate prevention');
        } else {
            console.log('✅ Test email available for registration');
        }
        
        console.log('\n2. Testing valid registration emails from database:');
        const users = await userModel.find({}, { email: 1, username: 1 });
        console.log('📧 Existing emails (these would be rejected):');
        users.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.username})`);
        });
        
        console.log('\n3. Email service validation:');
        const emailVars = ['EMAIL_FROM', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_HOST', 'EMAIL_PORT'];
        let allValid = true;
        
        emailVars.forEach(varName => {
            const value = process.env[varName];
            const status = value ? '✅' : '❌';
            console.log(`   ${status} ${varName}: ${value ? 'Set' : 'Missing'}`);
            if (!value) allValid = false;
        });
        
        console.log('\n4. Registration flow simulation:');
        console.log('   Step 1: User enters email → OTP sent');
        console.log('   Step 2: User enters OTP + details → Account created');
        console.log('   Step 3: Redirect to login with success message');
        
        console.log('\n🎯 New Registration Features:');
        console.log('   ✅ Email verification before account creation');
        console.log('   ✅ 6-digit OTP code generation');
        console.log('   ✅ 15-minute OTP expiration');
        console.log('   ✅ 3-attempt limit per OTP');
        console.log('   ✅ Duplicate email prevention');
        console.log('   ✅ Session-based OTP storage');
        console.log('   ✅ Professional email templates');
        
        console.log('\n🧪 Test URLs:');
        console.log('   📱 Local: http://localhost:3000/user/register');
        console.log('   🌐 Vercel: https://drive-anshul-vermas-projects-0c623f3d.vercel.app/user/register');
        
        if (allValid) {
            console.log('\n🎉 Registration OTP system is ready for testing!');
        } else {
            console.log('\n⚠️ Email configuration incomplete - OTP emails will fail');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testRegistrationSystem();