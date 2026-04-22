import mongoose from 'mongoose';

const interviewReportSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    candidateName: {
      type: String,
      default: 'Anonymous Candidate'
    },
    questionsList: [
      {
        type: String,
        required: true,
      }
    ],
    scoresList: [
      {
        type: Number,
        required: true,
      }
    ],
    reasonsList: [
      {
        type: String,
        required: true,
      }
    ],
    finalReport: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReport;
