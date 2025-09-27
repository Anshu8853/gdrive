const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    console.log('Auth check - token:', token ? 'exists' : 'missing');
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            console.log('Auth success - user:', decoded.userId);
            next();
        } catch (error) {
            console.log('Auth failed - invalid token:', error.message);
            res.redirect('/user/login');
        }
    } else {
        console.log('Auth failed - no token');
        res.redirect('/user/login');
    }
};

const isAdmin = (req, res, next) => {
    isAuthenticated(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.redirect('/home');
        }
    });
};

const redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/home');
        } catch (error) {
            // Invalid token, proceed to login/register page
        }
    }
    next();
};

module.exports = { isAuthenticated, isAdmin, redirectIfLoggedIn };