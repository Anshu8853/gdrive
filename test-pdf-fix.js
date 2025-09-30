// Test the fixed PDF viewing with the actual stored URLs
const { config } = require('dotenv');
config();

const axios = require('axios');

async function testFixedPdfUrls() {
    try {
        // Test the stored Cloudinary URL we found
        const storedUrl = 'https://res.cloudinary.com/dclqfvqz9/image/upload/v1759234872/drive-uploads/rya9glflsli3vph6lzlr.pdf';
        
        console.log('🧪 Testing the stored Cloudinary URL...');
        console.log('URL:', storedUrl);
        
        try {
            const response = await axios.head(storedUrl, { timeout: 10000 });
            console.log('✅ Success!');
            console.log('Status:', response.status);
            console.log('Content-Type:', response.headers['content-type']);
            console.log('Content-Length:', response.headers['content-length']);
            
            // Test if we can actually get the PDF content
            const contentResponse = await axios.get(storedUrl, { 
                responseType: 'stream',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            console.log('✅ PDF content accessible!');
            console.log('Content status:', contentResponse.status);
            
        } catch (error) {
            console.log('❌ Error accessing stored URL:', error.response ? error.response.status : error.message);
        }
        
        // Also test some variations
        const variations = [
            'https://res.cloudinary.com/dclqfvqz9/raw/upload/drive-uploads/rya9glflsli3vph6lzlr',
            'https://res.cloudinary.com/dclqfvqz9/raw/upload/v1759234872/drive-uploads/rya9glflsli3vph6lzlr',
            'https://res.cloudinary.com/dclqfvqz9/image/upload/drive-uploads/rya9glflsli3vph6lzlr',
        ];
        
        console.log('\n🔄 Testing URL variations...');
        for (const url of variations) {
            console.log(`\nTesting: ${url}`);
            try {
                const response = await axios.head(url, { timeout: 5000 });
                console.log(`✅ Status: ${response.status}`);
            } catch (error) {
                console.log(`❌ Error: ${error.response ? error.response.status : error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testFixedPdfUrls();