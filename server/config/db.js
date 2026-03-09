const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  await Invoice.syncIndexes();
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
