// Test PDF viewing to identify the "PDF not found" error
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');

async function testPdfViewing() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        // Find users with PDF files
        const users = await userModel.find({
            file: { $exists: true, $ne: [] }
        });
        
        console.log(`\n🔍 Found ${users.length} users with files`);
        
        for (const user of users) {
            console.log(`\n👤 User: ${user.username} (${user.email})`);
            console.log(`📁 Files: ${user.file ? user.file.length : 0}`);
            
            if (user.file && Array.isArray(user.file)) {
                user.file.forEach((file, index) => {
                    console.log(`  File ${index + 1}:`);
                    
                    if (typeof file === 'string') {
                        console.log(`    Type: String`);
                        console.log(`    Value: ${file}`);
                        console.log(`    Extension: ${file.split('.').pop() || 'unknown'}`);
                        
                        // Check if it's a PDF
                        if (file.toLowerCase().includes('pdf') || file.split('.').pop().toLowerCase() === 'pdf') {
                            console.log(`    ✅ PDF DETECTED`);
                            console.log(`    URL would be: https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${file}`);
                        }
                    } else if (typeof file === 'object') {
                        console.log(`    Type: Object`);
                        console.log(`    Filename: ${file.filename || 'N/A'}`);
                        console.log(`    Public ID: ${file.publicId || 'N/A'}`);
                        console.log(`    Original Name: ${file.originalName || file.originalname || 'N/A'}`);
                        console.log(`    Cloudinary URL: ${file.cloudinaryUrl || 'N/A'}`);
                        
                        const originalName = file.originalName || file.originalname || '';
                        const extension = originalName.split('.').pop().toLowerCase();
                        console.log(`    Extension: ${extension}`);
                        
                        if (extension === 'pdf') {
                            console.log(`    ✅ PDF DETECTED`);
                            const publicId = file.filename || file.publicId;
                            console.log(`    URL would be: https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`);
                        }
                    }
                });
            }
        }
        
        console.log('\n🔧 Testing PDF URLs...');
        
        // Test a few PDF URLs to see if they're accessible
        const axios = require('axios');
        
        for (const user of users) {
            if (user.file && Array.isArray(user.file)) {
                for (const file of user.file) {
                    let pdfUrl = null;
                    let isPdf = false;
                    
                    if (typeof file === 'string') {
                        if (file.toLowerCase().includes('pdf') || file.split('.').pop().toLowerCase() === 'pdf') {
                            pdfUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${file}`;
                            isPdf = true;
                        }
                    } else if (typeof file === 'object') {
                        const originalName = file.originalName || file.originalname || '';
                        const extension = originalName.split('.').pop().toLowerCase();
                        
                        if (extension === 'pdf') {
                            const publicId = file.filename || file.publicId;
                            pdfUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`;
                            isPdf = true;
                        }
                    }
                    
                    if (isPdf && pdfUrl) {
                        console.log(`\n🧪 Testing PDF URL: ${pdfUrl}`);
                        try {
                            const response = await axios.head(pdfUrl, { timeout: 5000 });
                            console.log(`    ✅ Status: ${response.status}`);
                            console.log(`    Content-Type: ${response.headers['content-type'] || 'N/A'}`);
                            console.log(`    Content-Length: ${response.headers['content-length'] || 'N/A'}`);
                        } catch (error) {
                            console.log(`    ❌ Error: ${error.response ? error.response.status : error.message}`);
                            
                            // Try alternative URL formats
                            const altUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${file.filename || file.publicId || file}`;
                            console.log(`    🔄 Trying alternative: ${altUrl}`);
                            try {
                                const altResponse = await axios.head(altUrl, { timeout: 5000 });
                                console.log(`    ✅ Alternative works! Status: ${altResponse.status}`);
                            } catch (altError) {
                                console.log(`    ❌ Alternative failed: ${altError.response ? altError.response.status : altError.message}`);
                            }
                        }
                        
                        // Only test first PDF to avoid spam
                        break;
                    }
                }
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testPdfViewing();