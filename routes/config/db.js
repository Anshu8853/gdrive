const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    throw err;
  }
};

module.exports = connectDB;