// Quick test to verify environment variables in production
// This will run on Vercel and show us what's actually loaded

const testEmailConfig = () => {
    console.log('=== VERCEL EMAIL CONFIG DEBUG ===');
    
    const vars = ['EMAIL_FROM', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_HOST', 'EMAIL_PORT'];
    
    vars.forEach(varName => {
        const value = process.env[varName];
        console.log(`${varName}: ${value ? 'SET (' + value.length + ' chars)' : 'NOT SET'}`);
        
        if (value) {
            // Check for hidden characters
            const cleanValue = value.trim();
            if (cleanValue !== value) {
                console.log(`  WARNING: ${varName} has extra whitespace!`);
            }
        }
    });
    
    // Test validation function
    try {
        const { validateEmailConfig } = require('./services/emailService');
        const isValid = validateEmailConfig();
        console.log(`Email Config Valid: ${isValid}`);
    } catch (error) {
        console.log(`Validation Error: ${error.message}`);
    }
};

module.exports = { testEmailConfig };