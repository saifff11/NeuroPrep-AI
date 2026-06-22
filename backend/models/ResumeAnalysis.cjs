const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  analysisId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: 'guest', index: true },
  targetRole: { type: String, default: 'Software Engineer' },
  atsScore: { type: Number, default: 0 },
  jobMatchScore: { type: Number, default: 0 },
  placementReadinessScore: { type: Number, default: 0 },
  matchedSkills: [String],
  missingSkills: [String],
  targetSkills: [String],
  suggestedKeywords: [String],
  extractedSkills: [{
    name: String,
    category: String
  }],
  sectionAnalysis: [{
    label: String,
    score: Number
  }],
  suggestions: [String],
  roadmap: {
    currentScore: Number,
    targetScore: Number,
    weeks: [{
      week: Number,
      focus: String,
      goals: [String],
      outcome: String
    }]
  },
  interviewQuestions: [{
    topic: String,
    difficulty: String,
    type: String,
    question: String
  }],
  resumeSummary: {
    wordCount: Number,
    sections: mongoose.Schema.Types.Mixed,
    contact: mongoose.Schema.Types.Mixed,
    detectedSkillCount: Number
  },
  source: { type: String, default: 'resume-analyzer' },
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
