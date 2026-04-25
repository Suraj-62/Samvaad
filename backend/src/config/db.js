import mongoose from 'mongoose';

// Cache the connection to prevent multiple connections in serverless environment
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Please define the MONGO_URI environment variable inside .env or Vercel dashboard');
    }

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log('MongoDB Connected Successfully');
      return mongoose;
    }).catch(err => {
      console.error('MongoDB Connection Error:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;

