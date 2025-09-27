const request = require('supertest');
const app = require('../app');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

jest.mock('../models/user.model');

describe('Admin Routes', () => {
    let adminToken;
    let userToken;

    beforeEach(() => {
        adminToken = jwt.sign({ userId: '123', role: 'admin' }, process.env.JWT_SECRET);
        userToken = jwt.sign({ userId: '456', role: 'user' }, process.env.JWT_SECRET);
    });

    describe('GET /admin/dashboard', () => {
        it('should render the admin dashboard for admin users', async () => {
            userModel.find.mockResolvedValue([]);
            const res = await request(app).get('/admin/dashboard').set('Cookie', `token=${adminToken}`);
            expect(res.statusCode).toEqual(200);
        });

        it('should redirect to /home for non-admin users', async () => {
            const res = await request(app).get('/admin/dashboard').set('Cookie', `token=${userToken}`);
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/home');
        });

        it('should redirect to /user/login if not logged in', async () => {
            const res = await request(app).get('/admin/dashboard');
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/user/login');
        });
    });
});