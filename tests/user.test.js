const request = require('supertest');
const app = require('../app');
const userModel = require('../models/user.model');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

jest.mock('../models/user.model');
jest.mock('cloudinary');
const mongoose = require('mongoose');

jest.mock('multer', () => {
    const multer = () => ({
        single: () => (req, res, next) => {
            req.file = { public_id: 'test' };
            next();
        }
    });
    multer.diskStorage = () => {};
    return multer;
});

jest.mock('multer-storage-cloudinary', () => {
    return {
        CloudinaryStorage: class {
            constructor() {
                this.options = {};
            }
            _handleFile(req, file, cb) {
                cb(null, { public_id: 'test' });
            }
            _removeFile(req, file, cb) {
                cb(null);
            }
        }
    };
});

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('User Routes', () => {
    let token;

    beforeEach(() => {
        token = jwt.sign({ userId: '123', role: 'user' }, process.env.JWT_SECRET);
    });

    describe('GET /user/register', () => {
        it('should render the register page', async () => {
            const res = await request(app).get('/user/register');
            expect(res.statusCode).toEqual(200);
        });

        it('should redirect to /home if logged in', async () => {
            const res = await request(app).get('/user/register').set('Cookie', `token=${token}`);
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/home');
        });
    });

    describe('POST /user/register', () => {
        it('should create a new user and return it', async () => {
            const user = { username: 'test', email: 'test@test.com', password: 'password' };
            userModel.create.mockResolvedValue(user);
            const res = await request(app).post('/user/register').send(user);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(user);
        });
    });

    describe('GET /user/login', () => {
        it('should render the login page', async () => {
            const res = await request(app).get('/user/login');
            expect(res.statusCode).toEqual(200);
        });

        it('should redirect to /home if logged in', async () => {
            const res = await request(app).get('/user/login').set('Cookie', `token=${token}`);
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/home');
        });
    });

    describe('POST /user/login', () => {
        it('should login a user and redirect to /home', async () => {
            const user = { _id: '123', username: 'test', password: 'password', email: 'test@test.com', role: 'user' };
            userModel.findOne.mockResolvedValue(user);
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const res = await request(app).post('/user/login').send(user);
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/home');
        });
    });

    describe('POST /user/upload', () => {
        it('should upload a file and redirect to /home', async () => {
            const user = { _id: '123', file: [] };
            userModel.findById.mockResolvedValue(user);
            userModel.updateOne.mockResolvedValue({});
            const res = await request(app)
                .post('/user/upload')
                .set('Cookie', `token=${token}`)
                .attach('file', Buffer.from('test'), 'test.txt');
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/home?upload=success');
        });
    });

    describe('POST /user/delete-file', () => {
        it('should delete a file and redirect to /home', async () => {
            const user = { _id: '123' };
            userModel.findById.mockResolvedValue(user);
            userModel.updateOne.mockResolvedValue({});
            cloudinary.uploader.upload_stream.mockImplementation(() => ({ write: () => {}, end: () => {} }));
            cloudinary.uploader.destroy.mockImplementation((filename, callback) => callback());
            const res = await request(app)
                .post('/user/delete-file')
                .set('Cookie', `token=${token}`)
                .send({ filename: 'test.txt' });
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/home?delete=success');
        });
    });

    describe('GET /user/logout', () => {
        it('should clear the token and redirect to /user/login', async () => {
            const res = await request(app).get('/user/logout');
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toEqual('/user/login');
            expect(res.headers['set-cookie'][0]).toContain('token=;');
        });
    });
});