const { testEmailConnection, validateEmailConfig } = require('./services/emailService');
require('dotenv').config();

async function setupEmail() {
    console.log('🔧 GDrive Email Setup & Test\n');
    
    // Step 1: Check configuration
    console.log('Step 1: Checking email configuration...');
    const isConfigValid = validateEmailConfig();
    
    if (!isConfigValid) {
        console.log('\n❌ Email configuration is incomplete!');
        console.log('\n📋 Follow these steps to set up Gmail SMTP:');
        console.log('');
        console.log('1. Enable 2-Factor Authentication on your Gmail account');
        console.log('   - Go to myaccount.google.com');
        console.log('   - Security → 2-Step Verification');
        console.log('');
        console.log('2. Generate an App Password:');
        console.log('   - In Security settings → App passwords');
        console.log('   - Select "Mail" as the app');
        console.log('   - Copy the 16-character password');
        console.log('');
        console.log('3. Update your .env file:');
        console.log('   - Replace EMAIL_USER with your Gmail address');
        console.log('   - Replace EMAIL_PASS with the App Password from step 2');
        console.log('   - Replace EMAIL_FROM with your Gmail address');
        console.log('');
        console.log('Current .env values that need updating:');
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'anshulverma2003lmp2@gmail.com') {
            console.log('   ❌ EMAIL_USER: Not set or using placeholder');
        }
        if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-16-digit-app-password') {
            console.log('   ❌ EMAIL_PASS: Not set or using placeholder');
        }
        if (!process.env.EMAIL_FROM || process.env.EMAIL_FROM === 'anshulverma2003lmp2@gmail.com') {
            console.log('   ❌ EMAIL_FROM: Not set or using placeholder');
        }
        console.log('');
        console.log('After updating .env, restart the server and run this test again.');
        return;
    }
    
    // Step 2: Test connection
    console.log('\nStep 2: Testing email connection...');
    const testResult = await testEmailConnection();
    
    if (testResult.success) {
        console.log('✅ Email connection successful!');
        console.log('🎉 Your email service is ready to send OTP codes!');
        console.log('\nNext steps:');
        console.log('1. Restart your server: npm start');
        console.log('2. Test forgot password functionality');
        console.log('3. OTP codes will now be sent to email instead of console');
    } else {
        console.log('❌ Email connection failed!');
        console.log('Error:', testResult.error);
        console.log('\n🔍 Common solutions:');
        console.log('1. Make sure 2-Factor Authentication is enabled');
        console.log('2. Use App Password, not your regular Gmail password');
        console.log('3. Check that the App Password is 16 characters');
        console.log('4. Ensure no spaces in the App Password');
        console.log('5. Try generating a new App Password');
    }
}

// Run the setup
setupEmail().catch(console.error);