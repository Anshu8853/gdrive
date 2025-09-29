const { validateEmailConfig } = require('./services/emailService');
require('dotenv').config();

console.log('🔍 Testing Email Validation\n');

console.log('Environment Variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (' + process.env.EMAIL_PASS.length + ' chars)' : 'Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

console.log('\nTesting validation...');
const isValid = validateEmailConfig();
console.log('Validation result:', isValid);

// Test the actual email sending
console.log('\nTesting simple email send...');

const nodemailer = require('nodemailer');

async function quickTest() {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.verify();
        console.log('✅ Gmail connection successful');
        
        // Send test OTP
        const testOTP = '123456';
        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER,
            subject: 'Test OTP - GDrive',
            html: `<p>Your test OTP code is: <strong>${testOTP}</strong></p>`
        });
        
        console.log('✅ Test email sent successfully');
        console.log('Message ID:', result.messageId);
        
    } catch (error) {
        console.log('❌ Email test failed:', error.message);
    }
}

quickTest();