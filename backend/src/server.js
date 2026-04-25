import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import interviewRoutes from './routes/interviewRoutes.js';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';


const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed in middleware:', err.message);
    res.status(500).json({ 
      message: 'Database connection failed. Please check your MONGO_URI in Vercel settings.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Log environment variable status (sanitized)
console.log('Environment Check:', {
  hasMongo: !!process.env.MONGO_URI,
  hasJwt: !!process.env.JWT_SECRET,
  hasGemini: !!process.env.GEMINI_API_KEY,
  nodeEnv: process.env.NODE_ENV
});

// Main Interview AI Routes mounting 
app.use('/api/interview', interviewRoutes);

// Auth Routes mounting
app.use('/api/auth', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message, details: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});



// Serve uploads folder statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('HEALTH CHECK HIT');
  res.json({ status: 'ok', service: 'Samvaad Interview Backend is running' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
