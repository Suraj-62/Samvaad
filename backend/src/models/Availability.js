import mongoose from 'mongoose';

const availabilitySchema = mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true, // Format: YYYY-MM-DD
    },
    startTime: {
      type: String,
      required: true, // Format: HH:mm
    },
    endTime: {
      type: String,
      required: true, // Format: HH:mm
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;
