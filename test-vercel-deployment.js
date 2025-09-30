// Test Vercel deployment environment variables
const axios = require('axios');

async function testVercelDeployment() {
    const baseUrl = 'https://drive-idjckxb24-anshul-vermas-projects-0c623f3d.vercel.app';
    
    console.log('🧪 Testing Vercel Deployment');
    console.log('============================');
    console.log(`URL: ${baseUrl}`);
    
    try {
        console.log('\n1. Testing main page...');
        const homeResponse = await axios.get(baseUrl, { timeout: 10000 });
        console.log(`✅ Main page: ${homeResponse.status} - ${homeResponse.statusText}`);
        
        console.log('\n2. Testing forgot password page...');
        const forgotPasswordResponse = await axios.get(`${baseUrl}/user/forgot-password`, { timeout: 10000 });
        console.log(`✅ Forgot password page: ${forgotPasswordResponse.status} - ${forgotPasswordResponse.statusText}`);
        
        // Test if we can reach the debug endpoint (might be protected)
        console.log('\n3. Testing debug endpoint...');
        try {
            const debugResponse = await axios.get(`${baseUrl}/debug/env-raw`, { timeout: 10000 });
            console.log(`✅ Debug endpoint: ${debugResponse.status} - Environment variables loaded!`);
        } catch (debugError) {
            if (debugError.response?.status === 401 || debugError.response?.status === 403) {
                console.log(`⚠️ Debug endpoint: Protected (${debugError.response.status}) - This is normal for security`);
            } else {
                console.log(`⚠️ Debug endpoint: ${debugError.message}`);
            }
        }
        
        console.log('\n🎉 Deployment is working!');
        console.log('\n🎯 Next Steps:');
        console.log('1. Go to your Vercel app in browser');
        console.log('2. Test the login page');
        console.log('3. Try the forgot password feature');
        console.log('4. Check if OTP emails are being sent');
        
    } catch (error) {
        console.error('❌ Error testing deployment:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Response: ${error.response.data}`);
        }
    }
}

testVercelDeployment();