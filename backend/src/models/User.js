import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'interviewer', 'admin'],
    default: 'student',
  },
  // Interviewer specific fields
  experience: {
    type: Number,
  },
  jobRole: {
    type: String,
  },
  resumePath: {
    type: String,
  },
  resumeText: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false, // Will be set to true immediately for students, false for interviewers until admin approves
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  profilePic: {
    type: String,
    default: '',
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
