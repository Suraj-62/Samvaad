import User from '../models/User.js';
import HumanBooking from '../models/HumanBooking.js';
import GroupDiscussion from '../models/GroupDiscussion.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendRegistrationEmail, sendApprovalEmail, sendWelcomeEmail } from '../services/emailService.js';
// import { PDFParse } from 'pdf-parse'; // Moved to dynamic import for Vercel compatibility
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

// client will be initialized on first use or use a getter to ensure process.env is ready
let client;
const getGoogleClient = () => {
  if (!client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID is not defined in environment variables');
    }
    client = new OAuth2Client(clientId);
  }
  return client;
};



// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, experience, jobRole } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let isApproved = true;
    if (role === 'interviewer') {
      isApproved = false; // Interviewers need approval
    }

    const resumeFile = req.file;
    let resumeText = '';
    let resumePath = null;

    if (resumeFile) {
      // Convert buffer to Base64 for Vercel compatibility
      const base64Data = resumeFile.buffer.toString('base64');
      resumePath = `data:${resumeFile.mimetype};base64,${base64Data}`;

      if (resumeFile.mimetype === 'application/pdf') {
        try {
          console.log('Attempting to parse PDF resume...');
          const pdfModule = await import('pdf-parse');
          const PDFParse = pdfModule.PDFParse || pdfModule.default || (typeof pdfModule === 'function' ? pdfModule : null);
          
          if (PDFParse) {
             let data;
             if (typeof PDFParse === 'function' && !PDFParse.prototype?.getText) {
                // Legacy / functional pdf-parse usage
                data = await PDFParse(resumeFile.buffer);
             } else {
                // New / Class-based usage
                const parser = new PDFParse({ data: resumeFile.buffer });
                data = await parser.getText();
             }
             resumeText = data.text || '';
             console.log('Resume parsed successfully, length:', resumeText.length);
          } else {
             console.warn('PDFParse module not found or incompatible structure');
          }
        } catch (err) {
          console.error("Error parsing resume during registration:", err.message);
        }
      }
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      experience: experience || 0,
      jobRole: jobRole || '',
      resumePath,
      resumeText,
      isApproved,
    });

    if (user) {
      // Send the standard welcome email for all new users
      await sendWelcomeEmail(email, name);

      if (role === 'interviewer') {
        await sendRegistrationEmail(email, name);
      }
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        profilePic: user.profilePic,
        hasResume: !!(user.resumePath || user.resumeText),
        resumePath: user.resumePath,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Return error if blocked
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
      }

      // Return error if they are an unapproved interviewer
      if (user.role === 'interviewer' && !user.isApproved) {
        return res.status(403).json({ message: 'Your account is pending admin approval. Please wait for the confirmation email.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        profilePic: user.profilePic,
        hasResume: !!user.resumeText,
        resumeText: user.resumeText,
        resumePath: user.resumePath,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Error in authUser (Login):", error);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        profilePic: picture,
        role: 'student',
        isApproved: true,
      });
      
      // Send welcome email to the new Google Auth user
      await sendWelcomeEmail(email, name);
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
      }

      if (user.role === 'interviewer' && !user.isApproved) {
        return res.status(403).json({ message: 'Your account is pending admin approval.' });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      profilePic: user.profilePic || picture,
      hasResume: !!(user.resumePath || user.resumeText),
      resumePath: user.resumePath,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ message: 'Google authentication failed' });
  }
};

export const getPendingInterviewers = async (req, res) => {
  try {
    const interviewers = await User.find({ role: 'interviewer', isApproved: false }).select('-password');
    res.json(interviewers);
  } catch (error) {
    console.error("Error in getPending:", error);
    res.status(500).json({ message: 'Server error getting pending interviewers' });
  }
};

export const approveInterviewer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user && user.role === 'interviewer') {
      user.isApproved = true;
      const updatedUser = await user.save();
      
      await sendApprovalEmail(user.email, user.name);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isApproved: updatedUser.isApproved,
      });
    } else {
      res.status(404).json({ message: 'Interviewer not found' });
    }
  } catch (error) {
    console.error("Error in approve:", error);
    res.status(500).json({ message: 'Server error during approval' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const interviewCount = await HumanBooking.countDocuments({ email: user.email, status: 'completed' });
      const gdCount = await GroupDiscussion.countDocuments({ 
        $or: [{ host: user._id }, { 'participants.email': user.email }],
        status: 'completed'
      });
      const interviewsConducted = await HumanBooking.countDocuments({ interviewer: user._id, status: 'completed' });
      
      return { ...user, interviewCount, gdCount, interviewsConducted };
    }));

    res.json(usersWithCounts);
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'Cannot block an admin user' });
      }
      user.isBlocked = !user.isBlocked; // Toggle block status
      const updatedUser = await user.save();
      res.json({ message: `User ${updatedUser.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: updatedUser.isBlocked });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: 'Server error blocking user' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.jobRole) user.jobRole = req.body.jobRole;
      if (req.body.experience) user.experience = req.body.experience;
      
      if (req.files) {
        if (req.files.profilePic) {
          const file = req.files.profilePic[0];
          const base64Data = file.buffer.toString('base64');
          user.profilePic = `data:${file.mimetype};base64,${base64Data}`;
          console.log(`Profile picture updated for user: ${user.email}`);
        }
        if (req.files.resume) {
          const file = req.files.resume[0];
          const base64Data = file.buffer.toString('base64');
          user.resumePath = `data:${file.mimetype};base64,${base64Data}`;
          console.log(`Resume file uploaded for user: ${user.email}, size: ${file.size} bytes`);
          
          // Also parse and update resume text
          try {
            console.log('Attempting to parse PDF resume during profile update...');
            const pdfModule = await import('pdf-parse');
            const PDFParse = pdfModule.PDFParse || pdfModule.default || (typeof pdfModule === 'function' ? pdfModule : null);
            
            if (PDFParse) {
              let data;
              if (typeof PDFParse === 'function' && !PDFParse.prototype?.getText) {
                // Legacy / functional pdf-parse usage
                data = await PDFParse(file.buffer);
              } else {
                // New / Class-based usage
                const parser = new PDFParse({ data: file.buffer });
                data = await parser.getText();
              }
              user.resumeText = data.text || '';
              console.log(`Resume parsed successfully. Length: ${user.resumeText?.length || 0}`);
            } else {
              console.warn('PDFParse module not found or incompatible structure during profile update');
            }
          } catch (err) {
            console.error("Error parsing resume during profile update:", err);
          }
        }
      }

      const updatedUser = await user.save();
      console.log(`User profile saved: ${user.email}`);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePic: updatedUser.profilePic,
        hasResume: !!(updatedUser.resumePath || updatedUser.resumeText),
        resumeText: updatedUser.resumeText,
        resumePath: updatedUser.resumePath,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error in update profile:", error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'Cannot delete an admin user' });
      }
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};
