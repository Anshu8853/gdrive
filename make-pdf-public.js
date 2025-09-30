// Try to make the PDF file public in Cloudinary and test different approaches
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

async function makeFilePublicAndTest() {
    try {
        const publicId = 'drive-uploads/rya9glflsli3vph6lzlr';
        
        console.log('🔧 Attempting to make PDF file public...');
        console.log('Public ID:', publicId);
        
        // Try to update the access mode to public
        try {
            console.log('\n1. Updating access mode to public...');
            const updateResult = await cloudinary.api.update(publicId, {
                resource_type: 'image',
                access_mode: 'public'
            });
            console.log('✅ Update successful!');
            console.log('New access mode:', updateResult.access_mode);
            console.log('New secure URL:', updateResult.secure_url);
            
            // Test the updated URL
            if (updateResult.secure_url) {
                console.log('\n2. Testing updated public URL...');
                const response = await axios.head(updateResult.secure_url, { timeout: 5000 });
                console.log('✅ Public URL works! Status:', response.status);
                console.log('Content-Type:', response.headers['content-type']);
            }
            
        } catch (updateError) {
            console.log('❌ Update failed:', updateError.message);
        }
        
        // Try different URL generation approaches
        console.log('\n3. Testing different URL generation approaches...');
        
        const approaches = [
            {
                name: 'Simple public URL',
                url: cloudinary.url(publicId, {
                    resource_type: 'image',
                    secure: true
                })
            },
            {
                name: 'Public URL with version',
                url: cloudinary.url(publicId, {
                    resource_type: 'image',
                    secure: true,
                    version: '1759234872'
                })
            },
            {
                name: 'Public URL with fl_attachment',
                url: cloudinary.url(publicId, {
                    resource_type: 'image',
                    secure: true,
                    flags: 'attachment'
                })
            },
            {
                name: 'Raw resource type',
                url: cloudinary.url(publicId, {
                    resource_type: 'raw',
                    secure: true
                })
            }
        ];
        
        for (const approach of approaches) {
            console.log(`\n   Testing ${approach.name}:`);
            console.log(`   URL: ${approach.url}`);
            
            try {
                const response = await axios.head(approach.url, { timeout: 5000 });
                console.log(`   ✅ Works! Status: ${response.status}`);
                console.log(`   Content-Type: ${response.headers['content-type']}`);
                
                // If this works, test content download
                console.log(`   🔄 Testing content download...`);
                const contentResponse = await axios.get(approach.url, { 
                    responseType: 'stream',
                    timeout: 10000
                });
                console.log(`   ✅ Content accessible! Status: ${contentResponse.status}`);
                
                // This is our working URL!
                console.log(`\n🎉 WORKING APPROACH FOUND: ${approach.name}`);
                console.log(`🔗 Working URL: ${approach.url}`);
                break;
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response ? error.response.status : error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

makeFilePublicAndTest();