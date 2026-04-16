const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');

const shouldSyncIndexesOnBoot = () => {
  const raw = String(process.env.SYNC_INDEXES_ON_BOOT || '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);

  if (shouldSyncIndexesOnBoot()) {
    await Invoice.syncIndexes();
    console.log('Invoice indexes synchronized');
  }

  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
