const mongoose = require('mongoose');

function normalizeInterviewQuestion(value, index = 0) {
  if (!value) return null;

  if (typeof value === 'string') {
    const question = value.trim();
    if (!question) return null;

    return {
      topic: 'Resume Gap',
      difficulty: 'medium',
      type: 'skill-gap',
      question
    };
  }

  const question = String(value.question || value.text || value.prompt || '').trim();
  if (!question) return null;

  return {
    topic: String(value.topic || value.skill || `Question ${index + 1}`).trim(),
    difficulty: String(value.difficulty || 'medium').trim(),
    type: String(value.type || 'skill-gap').trim(),
    question
  };
}

function normalizeInterviewQuestions(values) {
  const list = Array.isArray(values) ? values : [values];
  return list
    .map(normalizeInterviewQuestion)
    .filter(Boolean)
    .slice(0, 10);
}

const interviewQuestionSchema = new mongoose.Schema({
  topic: { type: String, default: 'Resume Gap' },
  difficulty: { type: String, default: 'medium' },
  type: { type: String, default: 'skill-gap' },
  question: { type: String, required: true }
}, { _id: false });

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
  interviewQuestions: {
    type: [interviewQuestionSchema],
    default: [],
    set: normalizeInterviewQuestions
  },
  resumeSummary: {
    wordCount: Number,
    sections: mongoose.Schema.Types.Mixed,
    contact: mongoose.Schema.Types.Mixed,
    detectedSkillCount: Number
  },
  source: { type: String, default: 'resume-analyzer' },
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

function hasLegacyInterviewQuestionSchema(model) {
  return model?.schema?.path('interviewQuestions')?.caster?.instance === 'String';
}

if (hasLegacyInterviewQuestionSchema(mongoose.models.ResumeAnalysis)) {
  delete mongoose.models.ResumeAnalysis;
  delete mongoose.connection.models.ResumeAnalysis;
}

module.exports = mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
