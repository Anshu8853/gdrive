const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.redirect('/user/login');
        }
    } else {
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