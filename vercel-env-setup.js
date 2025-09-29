// Vercel Environment Variables Setup Script
// Run this locally to see what environment variables you need to add to Vercel

require('dotenv').config();

console.log('🔧 Vercel Environment Variables Setup\n');

const requiredEmailVars = [
    'EMAIL_FROM',
    'EMAIL_USER', 
    'EMAIL_PASS',
    'EMAIL_HOST',
    'EMAIL_PORT'
];

console.log('📋 Add these environment variables in Vercel Dashboard:\n');
console.log('Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n');

requiredEmailVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`${varName}=${value}`);
    } else {
        console.log(`${varName}=NOT_SET`);
    }
});

console.log('\n🚀 After adding all variables:');
console.log('1. Go to Deployments tab');
console.log('2. Click "..." on latest deployment');
console.log('3. Click "Redeploy"');
console.log('4. Wait for deployment to complete');
console.log('5. Test forgot password on your Vercel URL');

console.log('\n✅ The OTP system will then work on Vercel too!');