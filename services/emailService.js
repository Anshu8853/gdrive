const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
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

module.exports = {
  sendPasswordResetEmail
};