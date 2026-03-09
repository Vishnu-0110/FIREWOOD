const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

async function seedAdmin() {
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.error('SEED_ADMIN_PASSWORD missing in .env');
    process.exit(1);
  }

  const adminName = String(process.env.SEED_ADMIN_NAME || 'Admin').trim() || 'Admin';
  const adminEmail = String(process.env.SEED_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    existing.name = adminName;
    existing.password = adminPassword;
    existing.role = 'admin';
    await existing.save();
    console.log('Admin credentials updated');
    await mongoose.disconnect();
    return;
  }

  const existingAdminRoleUser = await User.findOne({ role: 'admin' });
  if (existingAdminRoleUser) {
    existingAdminRoleUser.name = adminName;
    existingAdminRoleUser.email = adminEmail;
    existingAdminRoleUser.password = adminPassword;
    await existingAdminRoleUser.save();
    console.log('Admin account normalized');
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword
  });

  console.log('Admin user created');
  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
