const nodemailer = require('nodemailer');

// Validate email configuration
const validateEmailConfig = () => {
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  const missing = required.filter(key => !process.env[key] || process.env[key] === 'your-email@gmail.com' || process.env[key] === 'your-16-digit-app-password');
  
  if (missing.length > 0) {
    console.log('❌ Email configuration incomplete. Missing/placeholder values for:', missing);
    return false;
  }
  
  console.log('✅ Email configuration is complete');
  return true;
};

// Create transporter
const createTransporter = () => {
  try {
    if (!validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }
    
    console.log('Creating email transporter with config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'not set'
    });
    
    return nodemailer.createTransport({
      service: 'gmail',  // Use Gmail service instead of manual SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    if (!validateEmailConfig()) {
      return { success: false, error: 'Email configuration incomplete' };
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email connection test successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Email connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (to, resetToken, username) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/user/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"GDrive Support" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: 'Password Reset Request - GDrive',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔒 Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8fafc;">
          <h2 style="color: #1e40af;">Hello ${username}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            We received a request to reset your password for your GDrive account. If you didn't make this request, you can safely ignore this email.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            To reset your password, click the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <p style="font-size: 12px; color: #9ca3af;">
              ⏰ This link will expire in 1 hour for security reasons.
              <br>
              🔐 If you didn't request this reset, please contact support immediately.
            </p>
          </div>
        </div>
        
        <div style="background-color: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2025 GDrive. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send OTP email for password reset
const sendOTPEmail = async (to, otpCode, username) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"GDrive Support" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: 'Password Reset OTP - GDrive',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔐 Password Reset OTP</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8fafc;">
          <h2 style="color: #007bff;">Hello ${username}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            You requested to reset your password for your GDrive account. Use the OTP code below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #e3f2fd; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; display: inline-block;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px; font-family: monospace;">
                ${otpCode}
              </h1>
            </div>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Enter this 6-digit code on the password reset page to continue.
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            ⏰ This OTP will expire in 10 minutes for security reasons.
            <br>
            🔐 If you didn't request this reset, please ignore this email.
            <br>
            🚫 Do not share this code with anyone.
          </p>
        </div>
        
        <div style="background-color: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2025 GDrive. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOTPEmail,
  testEmailConnection,
  validateEmailConfig
};