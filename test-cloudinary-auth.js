// Test Cloudinary authenticated URLs for accessing private files
const { config } = require('dotenv');
config();

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinaryAuth() {
    try {
        const fileId = 'drive-uploads/rya9glflsli3vph6lzlr';
        
        console.log('🔍 Testing Cloudinary authenticated URLs...');
        console.log('File ID:', fileId);
        
        // Test 1: Generate secure/signed URL
        try {
            const secureUrl = cloudinary.url(fileId, {
                resource_type: 'image',
                type: 'upload',
                sign_url: true,
                secure: true
            });
            console.log('\n1. Secure Image URL:', secureUrl);
            
            const axios = require('axios');
            const response = await axios.head(secureUrl, { timeout: 5000 });
            console.log('   ✅ Success! Status:', response.status);
        } catch (error) {
            console.log('   ❌ Error:', error.response ? error.response.status : error.message);
        }
        
        // Test 2: Raw resource type with auth
        try {
            const rawSecureUrl = cloudinary.url(fileId, {
                resource_type: 'raw',
                type: 'upload',
                sign_url: true,
                secure: true
            });
            console.log('\n2. Secure Raw URL:', rawSecureUrl);
            
            const axios = require('axios');
            const response = await axios.head(rawSecureUrl, { timeout: 5000 });
            console.log('   ✅ Success! Status:', response.status);
        } catch (error) {
            console.log('   ❌ Error:', error.response ? error.response.status : error.message);
        }
        
        // Test 3: Get resource info from Cloudinary API
        try {
            console.log('\n3. Getting resource info from Cloudinary API...');
            const resourceInfo = await cloudinary.api.resource(fileId, {
                resource_type: 'image'
            });
            console.log('   ✅ Resource found!');
            console.log('   Public ID:', resourceInfo.public_id);
            console.log('   Version:', resourceInfo.version);
            console.log('   Format:', resourceInfo.format);
            console.log('   Resource Type:', resourceInfo.resource_type);
            console.log('   Secure URL:', resourceInfo.secure_url);
            console.log('   URL:', resourceInfo.url);
            
            // Test the API-provided URL
            if (resourceInfo.secure_url) {
                console.log('\n   Testing API-provided secure URL...');
                const axios = require('axios');
                const response = await axios.head(resourceInfo.secure_url, { timeout: 5000 });
                console.log('   ✅ API URL works! Status:', response.status);
            }
            
        } catch (error) {
            console.log('   ❌ API Error:', error.message);
            
            // Try raw resource type
            try {
                console.log('   Trying raw resource type...');
                const rawResourceInfo = await cloudinary.api.resource(fileId, {
                    resource_type: 'raw'
                });
                console.log('   ✅ Raw resource found!');
                console.log('   Secure URL:', rawResourceInfo.secure_url);
                
                if (rawResourceInfo.secure_url) {
                    console.log('   Testing raw API URL...');
                    const axios = require('axios');
                    const response = await axios.head(rawResourceInfo.secure_url, { timeout: 5000 });
                    console.log('   ✅ Raw API URL works! Status:', response.status);
                }
            } catch (rawError) {
                console.log('   ❌ Raw API Error:', rawError.message);
            }
        }
        
        // Test 4: List all resources to find the actual file
        try {
            console.log('\n4. Listing resources to find actual file...');
            const resources = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'drive-uploads/',
                max_results: 50
            });
            
            console.log(`   Found ${resources.resources.length} resources:`);
            resources.resources.forEach((resource, index) => {
                console.log(`   ${index + 1}. ${resource.public_id} (${resource.format || 'no format'}) - ${resource.resource_type}`);
                if (resource.public_id.includes('rya9glflsli3vph6lzlr')) {
                    console.log(`      🎯 FOUND TARGET FILE!`);
                    console.log(`      Secure URL: ${resource.secure_url}`);
                    console.log(`      URL: ${resource.url}`);
                }
            });
            
        } catch (error) {
            console.log('   ❌ List Error:', error.message);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testCloudinaryAuth();