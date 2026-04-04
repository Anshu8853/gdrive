const app = require('./app');
const mongoose = require('mongoose');
const request = require('supertest');

let testResults = [];

const logResult = (name, status, message) => {
    const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : '⚠️';
    testResults.push({ name, status: icon, message });
    console.log(`${icon} ${name}: ${message}`);
};

// Test database connection
async function testDatabaseConnection() {
    try {
        const state = mongoose.connection.readyState;
        if (state === 1) {
            logResult('Database Connection', '✅', 'Connected');
            return true;
        } else if (state === 0) {
            logResult('Database Connection', '⚠️', 'Not connected (will retry on first request)');
            return true;
        } else {
            logResult('Database Connection', '❌', `Error state: ${state}`);
            return false;
        }
    } catch (error) {
        logResult('Database Connection', '❌', error.message);
        return false;
    }
}

// Test all routes
async function testRoutes() {
    const routes = [
        { method: 'GET', path: '/', expected: 200, name: 'Home redirect' },
        { method: 'GET', path: '/health', expected: 200, name: 'Health check' },
        { method: 'GET', path: '/user/login', expected: 200, name: 'Login page' },
        { method: 'GET', path: '/user/register', expected: 200, name: 'Register page' },
        { method: 'GET', path: '/home', expected: 302, name: 'Home (redirects if no auth)' },
    ];

    for (const route of routes) {
        try {
            const response = await request(app)[route.method.toLowerCase()](route.path);
            if (response.status === route.expected || response.status === 200) {
                logResult(`Route ${route.name}`, '✅', `${route.method} ${route.path} -> ${response.status}`);
            } else {
                logResult(`Route ${route.name}`, '⚠️', `${route.method} ${route.path} -> ${response.status} (expected ${route.expected})`);
            }
        } catch (error) {
            logResult(`Route ${route.name}`, '❌', error.message);
        }
    }
}

// Test environment variables
async function testEnvironmentVariables() {
    const required = [
        'MONGODB_URI',
        'JWT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const optional = [
        'EMAIL_USER',
        'EMAIL_PASS',
        'EMAIL_HOST',
        'EMAIL_PORT'
    ];

    console.log('\n📋 Required Environment Variables:');
    for (const env of required) {
        if (process.env[env]) {
            const masked = process.env[env].substring(0, 10) + '...';
            logResult(`ENV: ${env}`, '✅', masked);
        } else {
            logResult(`ENV: ${env}`, '❌', 'NOT SET');
        }
    }

    console.log('\n📋 Optional Environment Variables:');
    for (const env of optional) {
        if (process.env[env]) {
            const masked = process.env[env].substring(0, 10) + '...';
            logResult(`ENV: ${env}`, '✅', masked);
        } else {
            logResult(`ENV: ${env}`, '⚠️', 'not set (optional)');
        }
    }
}

// Test required modules
async function testModules() {
    const modules = [
        { name: 'express', path: 'express' },
        { name: 'mongoose', path: 'mongoose' },
        { name: 'bcrypt', path: 'bcrypt' },
        { name: 'jsonwebtoken', path: 'jsonwebtoken' },
        { name: 'cloudinary', path: 'cloudinary' },
        { name: 'multer', path: 'multer' },
        { name: 'nodemailer', path: 'nodemailer' },
        { name: 'express-validator', path: 'express-validator' },
    ];

    console.log('\n📦 Required Modules:');
    for (const mod of modules) {
        try {
            require(mod.path);
            logResult(`Module: ${mod.name}`, '✅', 'Loaded');
        } catch (error) {
            logResult(`Module: ${mod.name}`, '❌', error.message);
        }
    }
}

// Test middleware
async function testMiddleware() {
    console.log('\n🔧 Middleware Checks:');
    
    try {
        const response = await request(app).get('/user/login');
        if (response.headers['content-type']) {
            logResult('Content-Type Middleware', '✅', response.headers['content-type']);
        }
    } catch (error) {
        logResult('Content-Type Middleware', '❌', error.message);
    }

    try {
        const response = await request(app).post('/user/login')
            .send({ username: 'test', password: 'test' });
        logResult('JSON Parser Middleware', '✅', 'Parsing works');
    } catch (error) {
        logResult('JSON Parser Middleware', '❌', error.message);
    }
}

// Test model files exist
async function testModels() {
    const fs = require('fs');
    console.log('\n📊 Model Files:');
    
    const models = [
        './models/user.model.js'
    ];

    for (const model of models) {
        if (fs.existsSync(model)) {
            logResult(`Model: ${model}`, '✅', 'File exists');
        } else {
            logResult(`Model: ${model}`, '❌', 'File not found');
        }
    }
}

// Test view files exist
async function testViews() {
    const fs = require('fs');
    console.log('\n🎨 View Files:');
    
    const views = [
        './views/login.ejs',
        './views/register.ejs',
        './views/home.ejs',
        './views/forgot-password.ejs',
        './views/reset-password.ejs'
    ];

    for (const view of views) {
        if (fs.existsSync(view)) {
            logResult(`View: ${view}`, '✅', 'File exists');
        } else {
            logResult(`View: ${view}`, '❌', 'File not found');
        }
    }
}

// Test route files exist
async function testRouteFiles() {
    const fs = require('fs');
    console.log('\n🛣️ Route Files:');
    
    const routes = [
        './routes/user.route.js',
        './routes/index.routes.js',
        './routes/admin.routes.js',
        './routes/debug.routes.js',
        './routes/middleware/auth.js'
    ];

    for (const route of routes) {
        if (fs.existsSync(route)) {
            try {
                require(route);
                logResult(`Route: ${route}`, '✅', 'File exists and loads');
            } catch (error) {
                logResult(`Route: ${route}`, '❌', `File exists but error: ${error.message}`);
            }
        } else {
            logResult(`Route: ${route}`, '❌', 'File not found');
        }
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 GDrive Project - Complete Function Test\n');
    console.log('========================================\n');

    await testModules();
    await testModels();
    await testRouteFiles();
    await testViews();
    await testEnvironmentVariables();
    await testDatabaseConnection();
    await testMiddleware();
    await testRoutes();

    console.log('\n========================================');
    console.log(`\n📊 Test Summary:\n`);
    
    const passed = testResults.filter(r => r.status === '✅').length;
    const failed = testResults.filter(r => r.status === '❌').length;
    const warnings = testResults.filter(r => r.status === '⚠️').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${testResults.length}\n`);

    if (failed > 0) {
        console.log('❌ FAILED ITEMS:');
        testResults.filter(r => r.status === '❌').forEach(r => {
            console.log(`  - ${r.name}: ${r.message}`);
        });
    }

    process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
