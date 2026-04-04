// Vercel serverless function entry point
const app = require('../app');

// Export Express app for Vercel to wrap automatically
module.exports = app;
