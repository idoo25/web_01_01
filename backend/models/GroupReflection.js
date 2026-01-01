import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sentiment: {
    score: Number,
    label: String
  }
});

const scoresSchema = new mongoose.Schema({
  conversationQuality: { type: Number, min: 0, max: 10 },
  criticalThinking: { type: Number, min: 0, max: 10 },
  teamDynamics: { type: Number, min: 0, max: 10 },
  participationLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  overallScore: { type: Number, min: 0, max: 10 },
  insights: [String]
});

const hfAnalysisSchema = new mongoose.Schema({
  sentiment_score: Number,
  we_score: Number,
  conflict_count: Number,
  severity: String,
  urgency: String
});

const groupReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: String,
  groupName: {
    type: String,
    required: true
  },
  projectTopic: {
    type: String,
    required: true
  },
  conversationHistory: [messageSchema],
  hfAnalysis: hfAnalysisSchema,
  finalAnalysis: String,
  scores: scoresSchema,
  stage: {
    type: String,
    enum: ['setup', 'conversation', 'analysis', 'completed'],
    default: 'setup'
  },
  sessionNumber: {
    type: Number,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const GroupReflection = mongoose.model('GroupReflection', groupReflectionSchema);

export default GroupReflection;
