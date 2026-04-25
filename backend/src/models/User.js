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
    type: String, // Will store Base64 data for Vercel compatibility
  },
  resumeText: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  profilePic: {
    type: String, // Will store Base64 data
    default: '',
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
