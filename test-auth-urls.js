// Test the authenticated Cloudinary URLs
const { config } = require('dotenv');
config();

const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testAuthenticatedUrls() {
    try {
        const publicId = 'drive-uploads/rya9glflsli3vph6lzlr';
        
        console.log('🔐 Testing authenticated Cloudinary URLs...');
        console.log('Public ID:', publicId);
        
        // Generate authenticated URL
        const authenticatedUrl = cloudinary.url(publicId, {
            resource_type: 'image',
            type: 'upload',
            sign_url: true,
            secure: true
        });
        
        console.log('\n📝 Generated authenticated URL:', authenticatedUrl);
        
        // Test the authenticated URL
        try {
            console.log('\n🧪 Testing authenticated URL...');
            const response = await axios.head(authenticatedUrl, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            console.log('✅ SUCCESS! Status:', response.status);
            console.log('Content-Type:', response.headers['content-type']);
            console.log('Content-Length:', response.headers['content-length']);
            
            // Test actual content download
            console.log('\n📥 Testing content download...');
            const contentResponse = await axios.get(authenticatedUrl, { 
                responseType: 'stream',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            console.log('✅ Content download successful! Status:', contentResponse.status);
            console.log('Content-Type:', contentResponse.headers['content-type']);
            
            let totalSize = 0;
            contentResponse.data.on('data', (chunk) => {
                totalSize += chunk.length;
            });
            
            contentResponse.data.on('end', () => {
                console.log('✅ Total PDF size downloaded:', totalSize, 'bytes');
                console.log('\n🎉 PDF is fully accessible with authenticated URLs!');
                process.exit(0);
            });
            
        } catch (error) {
            console.log('❌ Error:', error.response ? error.response.status : error.message);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}

testAuthenticatedUrls();