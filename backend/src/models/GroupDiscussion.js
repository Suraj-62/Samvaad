import mongoose from 'mongoose';

const groupDiscussionSchema = mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      default: 'Group Discussion',
    },
    participants: [
      {
        email: String,
        name: String,
      },
    ],
    meetingId: {
      type: String,
      required: true,
    },
    meetingPassword: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

const GroupDiscussion = mongoose.model('GroupDiscussion', groupDiscussionSchema);

export default GroupDiscussion;
