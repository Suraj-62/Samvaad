import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import connectDB from './src/config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@samvaad.com' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'Super Admin',
      email: 'admin@samvaad.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
    });

    console.log('Admin seeded successfully (admin@samvaad.com / admin123)');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
