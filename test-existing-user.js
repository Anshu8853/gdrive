const axios = require('axios');

async function testWithExistingUser() {
    try {
        console.log('🧪 Testing Forgot Password with Existing User\n');
        
        // Use a known existing email from database
        const existingEmail = 'anshulverma2003lmp2@gmail.com'; // This was in the database
        console.log('Testing with existing email:', existingEmail);
        
        const response = await axios.post('http://localhost:3000/user/forgot-password', 
            `email=${encodeURIComponent(existingEmail)}`, 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('Response received!');
        
        // Check if OTP form is being shown
        if (response.data.includes('showOtpForm') || response.data.includes('Step 2')) {
            console.log('✅ SUCCESS: OTP form is being displayed');
        } else if (response.data.includes('OTP code is:')) {
            console.log('✅ SUCCESS: OTP code is being shown (fallback mode)');
        } else if (response.data.includes('Step 1')) {
            console.log('❌ ISSUE: Still showing Step 1, form not proceeding to Step 2');
        } else {
            console.log('❓ UNKNOWN: Check server logs for details');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Check if server is running on http://localhost:3000');
    }
}

testWithExistingUser();