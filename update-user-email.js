// Update existing user email to match working Gmail configuration
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');

async function updateUserEmail() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        // Find user with old email and update to new email
        const result = await userModel.updateOne(
            { email: 'anshulverma2003lmp2@gmail.com' },
            { email: 'anshulverma2003lmp@gmail.com' }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ User email updated successfully!');
            console.log('Old email: anshulverma2003lmp2@gmail.com');
            console.log('New email: anshulverma2003lmp@gmail.com');
            
            // Verify the update
            const user = await userModel.findOne({ email: 'anshulverma2003lmp@gmail.com' });
            if (user) {
                console.log('✅ Verification: User found with new email');
                console.log('Username:', user.username);
            }
        } else {
            console.log('❌ No user found with email: anshulverma2003lmp2@gmail.com');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateUserEmail();