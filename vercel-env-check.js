// Vercel Environment Variables Checker
// This script helps verify which environment variables are missing in Vercel

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET', 
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_FROM',
    'EMAIL_USER', 
    'EMAIL_PASS',
    'EMAIL_HOST',
    'EMAIL_PORT'
];

console.log('🔍 Checking Environment Variables...\n');

let missingVars = [];
let presentVars = [];

requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
        presentVars.push(varName);
        console.log(`✅ ${varName}: ${varName.includes('PASS') ? '[HIDDEN]' : process.env[varName].substring(0, 10) + '...'}`);
    } else {
        missingVars.push(varName);
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Present: ${presentVars.length}/${requiredEnvVars.length}`);
console.log(`❌ Missing: ${missingVars.length}/${requiredEnvVars.length}`);

if (missingVars.length > 0) {
    console.log(`\n🚨 Missing variables: ${missingVars.join(', ')}`);
    console.log('Please add these to your Vercel environment variables.');
} else {
    console.log('\n🎉 All environment variables are present!');
}

// Test email configuration specifically
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('\n📧 Email configuration appears complete.');
} else {
    console.log('\n📧 Email configuration is incomplete - this is why OTP is failing.');
}