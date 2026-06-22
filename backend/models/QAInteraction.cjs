const mongoose = require('mongoose');

const qaInteractionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  topic: {
    type: String,
    default: 'General'
  },
  difficulty: {
    type: String,
    default: 'medium'
  },
  question: {
    type: String,
    required: true
  },
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  explanation: String,
  userAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: {
    type: Boolean,
    default: false
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

qaInteractionSchema.index({ userId: 1, answeredAt: -1 });
qaInteractionSchema.index({ topic: 1, difficulty: 1 });

module.exports = mongoose.model('QAInteraction', qaInteractionSchema);
