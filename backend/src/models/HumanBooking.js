import mongoose from 'mongoose';

const humanBookingSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
    },
    experience: {
      type: String,
    },
    slot: {
      type: String,
      required: true,
    },
    rawDate: {
      type: String, // YYYY-MM-DD
    },
    startTime: {
      type: String, // HH:mm
    },
    endTime: {
      type: String, // HH:mm
    },
    meetingId: {
      type: String,
      required: true,
    },
    meetingPassword: {
      type: String,
      required: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
  }
);

const HumanBooking = mongoose.model('HumanBooking', humanBookingSchema);

export default HumanBooking;
