// ====================================================================
// Interview Model - models/Interview.js
// Schema for storing interview data
// ====================================================================

import mongoose from 'mongoose';

const questionAnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    default: ''
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewee: {
    name: {
      type: String,
      required: [true, 'Interviewee name is required'],
      trim: true
    },
    background: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  topic: {
    type: String,
    required: [true, 'Interview topic is required'],
    trim: true
  },
  questionsAndAnswers: [questionAnswerSchema],
  customQuestions: [{
    type: String,
    trim: true
  }],
  summary: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ====================================================================
// Indexes for better query performance
// ====================================================================
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ topic: 1 });
interviewSchema.index({ 'interviewee.name': 1 });

// ====================================================================
// Virtual for total questions count
// ====================================================================
interviewSchema.virtual('totalQuestions').get(function() {
  return this.questionsAndAnswers.length;
});

// ====================================================================
// Method to generate summary
// ====================================================================
interviewSchema.methods.generateSummary = function() {
  const intervieweeName = this.interviewee.name;
  const topic = this.topic;
  const date = this.interviewee.date.toLocaleDateString();
  const totalQuestions = this.questionsAndAnswers.length;
  
  return `Interview with ${intervieweeName} about ${topic} conducted on ${date}. ${totalQuestions} questions were asked.`;
};

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
