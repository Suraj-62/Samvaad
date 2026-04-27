import express from 'express';
import {
  bookHumanInterview,
  getBookings,
  getAllBookings,
  verifyMeeting,
  getUserStats,
  parseResume,
  addAvailability,
  getInterviewerAvailability,
  getPublicAvailableSlots,
  deleteAvailability,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  confirmBookingPublic,
  rejectBookingPublic,
  createInstantMeeting,
  createGroupDiscussion,
  getAdminStats,
  completeMeeting
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.get('/stats', protect, getUserStats);
router.get('/admin-stats', protect, getAdminStats);
router.post('/availability', protect, addAvailability);
router.get('/availability', protect, getInterviewerAvailability);
router.get('/available-slots', getPublicAvailableSlots);
router.delete('/availability/:id', protect, deleteAvailability);
router.put('/confirm-booking/:id', protect, confirmBooking);
router.put('/reject-booking/:id', protect, rejectBooking);
router.put('/cancel-booking/:id', protect, cancelBooking);
router.get('/public/confirm-booking/:id', confirmBookingPublic);
router.get('/public/reject-booking/:id', rejectBookingPublic);
router.post('/book-human', bookHumanInterview);
router.get('/bookings/:email', getBookings);
router.get('/all-bookings', protect, getAllBookings);
router.post('/verify-meeting', verifyMeeting);
router.post('/create-instant', protect, createInstantMeeting);
router.post('/create-group', protect, createGroupDiscussion);
router.put('/complete-meeting/:meetingId', completeMeeting);
router.post('/parse-resume', protect, upload.single('resume'), parseResume);

export default router;
