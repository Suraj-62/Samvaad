import express from 'express';
import { registerUser, authUser, googleAuth, getPendingInterviewers, approveInterviewer, getAllUsers, blockUser, deleteUser, updateUserProfile } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer storage configuration
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit (Safer for memory)
});

router.post('/register', upload.single('resume'), registerUser);
router.post('/login', authUser);
router.post('/google', googleAuth);
router.get('/pending-interviewers', protect, admin, getPendingInterviewers);
router.put('/approve/:id', protect, admin, approveInterviewer);

// New User Routes
router.put('/profile', protect, upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), updateUserProfile);

// New Admin Routes
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/block', protect, admin, blockUser);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
