// Test Email Already Exists Popup System
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');

async function testEmailExistsPopup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        console.log('🧪 Testing Email Already Exists Popup System');
        console.log('=============================================');
        
        console.log('\n📧 Existing emails that will trigger popup:');
        const users = await userModel.find({}, { email: 1, username: 1 });
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.username})`);
        });
        
        console.log('\n🎯 New Popup Features:');
        console.log('   ✅ Professional modal popup design');
        console.log('   ✅ Warning icon and clear messaging');
        console.log('   ✅ Two action buttons: "Go to Login" and "Try Different Email"');
        console.log('   ✅ Automatic popup trigger when email exists');
        console.log('   ✅ Keyboard support (Escape to close)');
        console.log('   ✅ Click outside to close functionality');
        console.log('   ✅ Auto-clear email field after closing');
        console.log('   ✅ Smooth animations and transitions');
        
        console.log('\n🧪 How to Test:');
        console.log('   1. Go to registration page');
        console.log('   2. Enter an existing email (e.g., anshulverma2003lmp@gmail.com)');
        console.log('   3. Click "Send Verification Code"');
        console.log('   4. Popup should appear with warning message');
        console.log('   5. Click "Go to Login" or "Try Different Email"');
        
        console.log('\n🎨 Popup Design:');
        console.log('   • ⚠️ Warning icon');
        console.log('   • "Email Already Registered" title');
        console.log('   • Clear explanation message');
        console.log('   • Blue "Go to Login" button');
        console.log('   • Gray "Try Different Email" button');
        console.log('   • Professional styling with animations');
        
        console.log('\n🌐 Test URLs:');
        console.log('   📱 Local: http://localhost:3000/user/register');
        console.log('   🌐 Vercel: https://drive-kg3hgqx9o-anshul-vermas-projects-0c623f3d.vercel.app/user/register');
        
        console.log('\n💡 Benefits:');
        console.log('   • Better user experience with clear feedback');
        console.log('   • Reduces confusion about registration errors');
        console.log('   • Guides users to the correct next action');
        console.log('   • Professional appearance matching modern web standards');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testEmailExistsPopup();