// Test different Cloudinary URL formats and access modes
const { config } = require('dotenv');
config();

const axios = require('axios');

async function testCloudinaryAccess() {
    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const fileId = 'rya9glflsli3vph6lzlr';
        const folderPath = 'drive-uploads';
        const versionId = 'v1759234872';
        
        console.log('🔍 Testing different Cloudinary URL formats...');
        console.log('Cloud Name:', cloudName);
        console.log('File ID:', fileId);
        console.log('Folder:', folderPath);
        console.log('Version:', versionId);
        
        const urlVariations = [
            // Different resource types with version
            `https://res.cloudinary.com/${cloudName}/image/upload/${versionId}/${folderPath}/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/${versionId}/${folderPath}/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/image/upload/${versionId}/${folderPath}/${fileId}`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/${versionId}/${folderPath}/${fileId}`,
            
            // Without version
            `https://res.cloudinary.com/${cloudName}/image/upload/${folderPath}/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/${folderPath}/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/image/upload/${folderPath}/${fileId}`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/${folderPath}/${fileId}`,
            
            // Auto resource type
            `https://res.cloudinary.com/${cloudName}/auto/upload/${versionId}/${folderPath}/${fileId}`,
            `https://res.cloudinary.com/${cloudName}/auto/upload/${folderPath}/${fileId}`,
            
            // Just the filename
            `https://res.cloudinary.com/${cloudName}/image/upload/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/image/upload/${fileId}`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/${fileId}`,
            
            // With fl_attachment flag for download
            `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${folderPath}/${fileId}.pdf`,
            `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${folderPath}/${fileId}.pdf`,
        ];
        
        for (let i = 0; i < urlVariations.length; i++) {
            const url = urlVariations[i];
            console.log(`\n${i + 1}. Testing: ${url}`);
            
            try {
                const response = await axios.head(url, { 
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                console.log(`   ✅ SUCCESS! Status: ${response.status}`);
                console.log(`   Content-Type: ${response.headers['content-type'] || 'N/A'}`);
                console.log(`   Content-Length: ${response.headers['content-length'] || 'N/A'}`);
                
                // If successful, test actual content
                try {
                    const contentResponse = await axios.get(url, { 
                        responseType: 'stream',
                        timeout: 10000,
                        maxRedirects: 5,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    console.log(`   ✅ Content accessible! Status: ${contentResponse.status}`);
                    
                    // This is the working URL!
                    console.log(`\n🎉 WORKING URL FOUND: ${url}`);
                    break;
                } catch (contentError) {
                    console.log(`   ⚠️  Head successful but content failed: ${contentError.response ? contentError.response.status : contentError.message}`);
                }
                
            } catch (error) {
                const status = error.response ? error.response.status : 'Network Error';
                const message = error.response ? error.response.statusText : error.message;
                console.log(`   ❌ ${status}: ${message}`);
            }
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testCloudinaryAccess();