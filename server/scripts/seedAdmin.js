const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

async function seedAdmin() {
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.error('SEED_ADMIN_PASSWORD missing in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com' });
  if (existing) {
    console.log('Admin already exists');
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.SEED_ADMIN_PASSWORD
  });

  console.log('Admin user created');
  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
