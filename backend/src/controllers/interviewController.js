import { sendPendingEmail, sendConfirmationEmail, sendInterviewerAlertEmail, sendGroupInvitationEmail } from '../services/emailService.js';
import InterviewReport from '../models/InterviewReport.js';
import HumanBooking from '../models/HumanBooking.js';
import GroupDiscussion from '../models/GroupDiscussion.js';
import User from '../models/User.js';
import fs from 'fs';
import Availability from '../models/Availability.js';

const formatAMPM = (timeStr) => {
  if (!timeStr) return '';
  let [hours, minutes] = timeStr.split(':');
  hours = parseInt(hours);
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const parseAMPM = (timeStr) => {
  // Converts "10:00 AM" back to "10:00" (24h)
  const [time, ampm] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const bookHumanInterview = async (req, res) => {
  try {
    const details = req.body;
    const { selectedDate, selectedTime } = req.body;
    
    if (!selectedDate || !selectedTime) {
      return res.status(400).json({ success: false, error: "Date and Time are required" });
    }

    // Find if any interviewer is available at this time
    // selectedTime will now be in format "h:mm AM - h:mm AM"
    const [startStr, endStr] = selectedTime.split(' - ');
    const startTime = parseAMPM(startStr);
    const endTime = parseAMPM(endStr);
    
    const availability = await Availability.findOne({ 
      date: selectedDate, 
      startTime: { $lte: startTime },
      endTime: { $gte: endTime },
      isBooked: false 
    }).populate('interviewer');

    if (!availability) {
      return res.status(404).json({ success: false, error: "This slot is no longer available. Please choose another." });
    }

    const interviewer = availability.interviewer;
    details.slot = `${new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'full' })} at ${selectedTime}`;
    
    // Generate Meeting ID and Password
    details.meetingId = Math.floor(100000000 + Math.random() * 900000000).toString().replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    details.meetingPassword = Math.random().toString(36).slice(-6).toUpperCase();

    // --- SLOT SPLITTING LOGIC ---
    // If the chosen time is a subset of the availability, split it
    const originalStart = availability.startTime;
    const originalEnd = availability.endTime;

    // 1. Create pre-slot if needed
    if (originalStart < startTime) {
      await Availability.create({
        interviewer: interviewer._id,
        date: selectedDate,
        startTime: originalStart,
        endTime: startTime,
        isBooked: false
      });
    }

    // 2. Create post-slot if needed
    if (originalEnd > endTime) {
      await Availability.create({
        interviewer: interviewer._id,
        date: selectedDate,
        startTime: endTime,
        endTime: originalEnd,
        isBooked: false
      });
    }

    // 3. Update the current record to match EXACTLY the booked time and mark as booked
    availability.startTime = startTime;
    availability.endTime = endTime;
    availability.isBooked = true;
    await availability.save();
    // ----------------------------

    // Send Pending email to student
    await sendPendingEmail(details);

    // Save booking to database as PENDING
    const newBooking = new HumanBooking({
      name: details.name,
      email: details.email,
      domain: details.role,
      experience: details.experience,
      slot: details.slot,
      rawDate: selectedDate,
      startTime: startTime,
      endTime: endTime,
      meetingId: details.meetingId,
      meetingPassword: details.meetingPassword,
      interviewer: interviewer._id,
      status: 'pending'
    });
    await newBooking.save();

    // Alert the specific interviewer
    try {
      await sendInterviewerAlertEmail(interviewer.email, { ...details, bookingId: newBooking._id });
    } catch (alertError) {
      console.error("Failed to notify interviewer:", alertError);
    }

    res.json({ success: true, slot: details.slot, meetingId: details.meetingId, meetingPassword: details.meetingPassword, status: 'pending' });
  } catch (error) {
    console.error("Error booking human interview:", error);
    res.status(500).json({ success: false, error: "Failed to schedule interview" });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await HumanBooking.findById(id);
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.interviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Send final confirmation email with join link
    await sendConfirmationEmail({
      name: booking.name,
      email: booking.email,
      slot: booking.slot,
      meetingId: booking.meetingId,
      meetingPassword: booking.meetingPassword
    });

    res.json({ success: true, message: 'Booking confirmed and student notified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to confirm' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await HumanBooking.findById(id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only the student who booked or the interviewer can cancel
    if (req.user.role === 'student' && booking.email !== req.user.email) {
       return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
       return res.status(400).json({ success: false, message: 'Cannot cancel a completed or already cancelled booking' });
    }

    // Free up the availability slot
    await Availability.findOneAndUpdate(
      { 
        interviewer: booking.interviewer, 
        date: booking.rawDate, 
        startTime: booking.startTime, 
        endTime: booking.endTime 
      }, 
      { isBooked: false }
    );

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await HumanBooking.findById(id);
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Free up the availability slot
    const [datePart, timePart] = booking.slot.split(' at ');
    const [startStr, endStr] = timePart.split(' - ');
    const startTime = parseAMPM(startStr);
    const endTime = parseAMPM(endStr);

    await Availability.findOneAndUpdate(
      { interviewer: booking.interviewer, date: { $regex: datePart }, startTime, endTime }, 
      { isBooked: false }
    );

    booking.status = 'rejected';
    await booking.save();

    res.json({ success: true, message: 'Booking rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reject' });
  }
};

export const getBookings = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }
    const bookings = await HumanBooking.find({ email }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch bookings" });
  }
};

export const verifyMeeting = async (req, res) => {
  try {
    const { meetingId, meetingPassword } = req.body;
    if (!meetingId || !meetingPassword) {
      return res.status(400).json({ success: false, error: "Meeting ID and Password are required" });
    }

    let meeting = await HumanBooking.findOne({ meetingId, meetingPassword });
    if (!meeting) {
      meeting = await GroupDiscussion.findOne({ meetingId, meetingPassword });
    }

    if (!meeting) {
      return res.status(404).json({ success: false, error: "Invalid Meeting ID or Password" });
    }

    res.json({ success: true, meeting });
  } catch (error) {
    console.error("Error verifying meeting:", error);
    res.status(500).json({ success: false, error: "Failed to verify meeting" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    let query = {};
    // If requester is an interviewer, show only their assigned bookings
    if (req.user && req.user.role === 'interviewer') {
      query = { interviewer: req.user._id };
    }
    
    const bookings = await HumanBooking.find(query).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch bookings" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const reports = await InterviewReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    if (reports.length === 0) {
      return res.json({
        totalSessions: 0,
        avgScore: 0,
        accuracy: 0,
        history: []
      });
    }

    const totalSessions = reports.length;
    const allScores = reports.flatMap(r => r.scoresList);
    const avgScore = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) : 0;
    
    // Recent history (last 5)
    const history = reports.slice(0, 5).map(r => ({
      _id: r._id,
      role: r.candidateName,
      date: new Date(r.createdAt).toLocaleDateString(),
      score: `${Math.round((r.scoresList.reduce((a, b) => a + b, 0) / r.scoresList.length) * 10)}/100`,
      status: "Completed"
    }));

    // New detailed counts
    const interviewCount = await HumanBooking.countDocuments({ email: req.user.email, status: 'completed' });
    const gdCount = await GroupDiscussion.countDocuments({ 
      $or: [{ host: req.user._id }, { 'participants.email': req.user.email }],
      status: 'completed'
    });

    res.json({
      totalSessions,
      avgScore,
      accuracy: Math.min(100, avgScore + 5),
      interviewCount,
      gdCount,
      history
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const totalInterviews = await HumanBooking.countDocuments({ status: 'completed' });
    const totalGDs = await GroupDiscussion.countDocuments({ status: 'completed' });
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalInterviewers = await User.countDocuments({ role: 'interviewer', isApproved: true });

    res.json({
      success: true,
      totalInterviews,
      totalGDs,
      totalUsers,
      totalInterviewers
    });
  } catch (error) {
    console.error("Error getting admin stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch admin stats" });
  }
};



export const parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded' });
    }

    const dataBuffer = req.file.buffer;
    const base64Data = dataBuffer.toString('base64');
    const resumePath = `data:${req.file.mimetype};base64,${base64Data}`;
    
    // Use PDFParse correctly for version 2.4.5
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    const extractedText = data.text;
    
    // Save to user profile if logged in
    let userUpdated = false;
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        resumePath: resumePath,
        resumeText: extractedText
      });
      userUpdated = true;
    }

    res.json({ 
      success: true, 
      text: extractedText, 
      userUpdated,
      hasResume: true 
    });
  } catch (error) {
    console.error("Error parsing resume:", error);
    res.status(500).json({ success: false, message: 'Failed to parse resume content' });
  }
};

export const addAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Date, start time, and end time are required' });
    }

    // Prevent duplicates for same interviewer
    const existing = await Availability.findOne({ interviewer: req.user._id, date, startTime, endTime });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This slot is already in your availability' });
    }

    const availability = new Availability({
      interviewer: req.user._id,
      date,
      startTime,
      endTime
    });

    await availability.save();
    res.json({ success: true, availability });
  } catch (error) {
    console.error("Error adding availability:", error);
    res.status(500).json({ success: false, error: "Failed to add availability" });
  }
};

export const getInterviewerAvailability = async (req, res) => {
  try {
    const availability = await Availability.find({ interviewer: req.user._id }).sort({ date: 1, startTime: 1 });
    res.json({ success: true, availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ success: false, error: "Failed to fetch availability" });
  }
};

export const getPublicAvailableSlots = async (req, res) => {
  try {
    // Get all unbooked slots
    const slots = await Availability.find({ isBooked: false }).sort({ date: 1, startTime: 1 });
    
    // Group by date and split large slots into 1-hour chunks
    const grouped = slots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      
      const start = new Date(`2000-01-01T${slot.startTime}`);
      const end = new Date(`2000-01-01T${slot.endTime}`);
      
      let current = new Date(start);
      while (current < end) {
        let next = new Date(current.getTime() + 60 * 60 * 1000); // Add 1 hour
        if (next > end) next = end;
        
        const currentStr = current.toTimeString().slice(0, 5);
        const nextStr = next.toTimeString().slice(0, 5);
        
        const range = `${formatAMPM(currentStr)} - ${formatAMPM(nextStr)}`;
        acc[slot.date].push(range);
        
        current = next;
      }
      
      return acc;
    }, {});

    res.json({ success: true, slots: grouped });
  } catch (error) {
    console.error("Error fetching public slots:", error);
    res.status(500).json({ success: false, error: "Failed to fetch slots" });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    await Availability.findOneAndDelete({ _id: id, interviewer: req.user._id, isBooked: false });
    res.json({ success: true, message: "Availability removed" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({ success: false, error: "Failed to delete" });
  }
};

export const confirmBookingPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await HumanBooking.findById(id);
    if (!booking) return res.send('<h1>Booking not found</h1>');
    if (booking.status !== 'pending') return res.send('<h1>This booking has already been processed.</h1>');

    booking.status = 'confirmed';
    await booking.save();

    await sendConfirmationEmail({
      name: booking.name,
      email: booking.email,
      slot: booking.slot,
      meetingId: booking.meetingId,
      meetingPassword: booking.meetingPassword
    });

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">✅ Interview Confirmed!</h1>
        <p>The student has been notified. You can see this in your dashboard.</p>
        <a href="/interviewer-dashboard" style="color: #4f46e5;">Go to Dashboard</a>
      </div>
    `);
  } catch (err) {
    res.send('<h1>Error processing request</h1>');
  }
};

export const rejectBookingPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await HumanBooking.findById(id);
    if (!booking) return res.send('<h1>Booking not found</h1>');

    const [datePart, timePart] = booking.slot.split(' at ');
    const [startStr, endStr] = timePart.split(' - ');
    const startTime = parseAMPM(startStr);
    const endTime = parseAMPM(endStr);

    await Availability.findOneAndUpdate(
      { interviewer: booking.interviewer, date: { $regex: datePart }, startTime, endTime }, 
      { isBooked: false }
    );

    booking.status = 'rejected';
    await booking.save();

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #ef4444;">❌ Interview Rejected</h1>
        <p>The slot has been made available again for other students.</p>
      </div>
    `);
  } catch (err) {
    res.send('<h1>Error processing request</h1>');
  }
};
export const createInstantMeeting = async (req, res) => {
  try {
    const { name, email, domain } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: "Student name and email are required" });
    }

    const meetingId = Math.floor(100000000 + Math.random() * 900000000).toString().replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    const meetingPassword = Math.random().toString(36).slice(-6).toUpperCase();
    const slot = `Instant Meeting on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`;

    const newBooking = new HumanBooking({
      name,
      email,
      domain: domain || 'Instant Session',
      slot,
      meetingId,
      meetingPassword,
      interviewer: req.user._id,
      status: 'confirmed'
    });

    await newBooking.save();

    try {
      await sendConfirmationEmail({
        name,
        email,
        slot,
        meetingId,
        meetingPassword
      });
    } catch (emailError) {
      console.error("Failed to send instant meeting email:", emailError);
    }

    res.json({ success: true, booking: newBooking });
  } catch (error) {
    console.error("Error creating instant meeting:", error);
    res.status(500).json({ success: false, error: "Failed to generate meeting" });
  }
};

export const createGroupDiscussion = async (req, res) => {
  try {
    const { topic, emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: "At least one friend's email is required" });
    }

    if (emails.length > 5) {
      return res.status(400).json({ success: false, error: "You can invite maximum 5 friends" });
    }

    const meetingId = Math.floor(100000000 + Math.random() * 900000000).toString().replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    const meetingPassword = Math.random().toString(36).slice(-6).toUpperCase();

    const group = new GroupDiscussion({
      host: req.user._id,
      topic: topic || 'Group Discussion',
      participants: emails.map(email => ({ email })),
      meetingId,
      meetingPassword
    });

    await group.save();

    // Send emails to all participants
    for (const email of emails) {
      try {
        await sendGroupInvitationEmail({
          hostName: req.user.name,
          email,
          topic: group.topic,
          meetingId,
          meetingPassword
        });
      } catch (err) {
        console.error(`Failed to send group invite to ${email}:`, err);
      }
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error("Error creating group discussion:", error);
    res.status(500).json({ success: false, error: "Failed to create group" });
  }
};
