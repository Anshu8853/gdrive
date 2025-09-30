// Quick login test to check user credentials
const { config } = require('dotenv');
config();

const mongoose = require('mongoose');
const userModel = require('./models/user.model');
const bcrypt = require('bcrypt');

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        
        const username = 'anshul';
        const user = await userModel.findOne({ username: username });
        
        if (user) {
            console.log('✅ User found:');
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Password Hash:', user.password ? 'EXISTS' : 'NOT SET');
            
            console.log('\n🧪 Testing passwords:');
            const testPasswords = ['anshul', 'password', '123456', 'anshul123'];
            
            for (const testPassword of testPasswords) {
                try {
                    const isMatch = await bcrypt.compare(testPassword, user.password);
                    console.log(`Password "${testPassword}": ${isMatch ? '✅ CORRECT' : '❌ WRONG'}`);
                    if (isMatch) {
                        console.log(`🎉 Login successful with password: ${testPassword}`);
                        break;
                    }
                } catch (error) {
                    console.log(`Password "${testPassword}": ERROR - ${error.message}`);
                }
            }
        } else {
            console.log('❌ User not found');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testLogin();