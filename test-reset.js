require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('./models/user.model');
const crypto = require('crypto');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'test@example.com'; // Replace with actual email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('Available users:');
      const users = await userModel.find({}, 'username email');
      users.forEach(u => console.log(`  - ${u.username}: ${u.email}`));
      await mongoose.disconnect();
      return;
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    
    // Save reset token to user
    await userModel.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry
      }
    );
    
    console.log('✅ Password reset token generated!');
    console.log('🔗 Reset link for', user.username + ':');
    console.log(`   http://localhost:3000/user/reset-password/${resetToken}`);
    console.log('⏰ Link expires in 1 hour');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
})();