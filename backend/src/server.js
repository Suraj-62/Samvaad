import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import interviewRoutes from './routes/interviewRoutes.js';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';


connectDB();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Main Interview AI Routes mounting 
app.use('/api/interview', interviewRoutes);

// Auth Routes mounting
app.use('/api/auth', authRoutes);

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
