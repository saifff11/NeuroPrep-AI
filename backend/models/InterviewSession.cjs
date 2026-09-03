const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true, default: 'medium' },
  duration: { type: Number, required: true, default: 0 },
  interviewType: { type: String, default: 'face-to-face', index: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  timeSpent: { type: Number, required: true, default: 0 },

  totalQuestions: { type: Number, required: true, default: 0 },
  answeredQuestions: { type: Number, required: true, default: 0 },
  questions: [{
    question: String,
    category: String,
    expectedPoints: [String],
    followUp: String,
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed
  }],
  answers: [{
    questionIndex: Number,
    question: String,
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    category: String,
    timestamp: Date,
    timeSpent: Number,
    score: Number,
    feedback: String,
    code: String,
    language: String
  }],
  correctAnswers: { type: Number, default: 0 },

  assessment: {
    overallScore: Number,
    overallRating: Number,
    percentage: Number,
    summary: String,
    categoryScores: mongoose.Schema.Types.Mixed,
    strengths: [String],
    improvements: [String],
    areasForImprovement: [String],
    recommendations: [String],
    detailedFeedback: String,
    detailedAnalysis: String,
    nextSteps: [String],
    interviewReadiness: String
  },

  source: String,
  metadata: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

interviewSessionSchema.index({ userId: 1, createdAt: -1 });
interviewSessionSchema.index({ userId: 1, interviewType: 1, createdAt: -1 });
interviewSessionSchema.index({ topic: 1, difficulty: 1 });

module.exports = mongoose.models.InterviewSession || mongoose.model('InterviewSession', interviewSessionSchema);
