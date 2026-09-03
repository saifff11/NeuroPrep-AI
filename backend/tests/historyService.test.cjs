const test = require('node:test');
const assert = require('node:assert/strict');

const InterviewSession = require('../models/InterviewSession.cjs');
const {
  normalizeAnswer,
  normalizeQuestion,
  saveAiInterviewReport,
  scoreToTen
} = require('../services/historyService.cjs');

test('normalizes plain and object questions for interview history', () => {
  assert.deepEqual(normalizeQuestion('Explain REST APIs', 0), {
    question: 'Explain REST APIs',
    category: 'General'
  });

  assert.deepEqual(normalizeQuestion({
    text: 'What is Docker?',
    topic: 'DevOps',
    expectedPoints: ['Containers', 'Images']
  }, 1), {
    question: 'What is Docker?',
    category: 'DevOps',
    expectedPoints: ['Containers', 'Images'],
    followUp: '',
    options: [],
    correctAnswer: undefined
  });
});

test('normalizes answer formats and score scales', () => {
  assert.equal(scoreToTen(85), 8.5);
  assert.equal(scoreToTen(7.5), 7.5);

  const answer = normalizeAnswer({
    questionIndex: 2,
    selectedAnswer: 'B',
    isCorrect: true,
    score: 9
  });

  assert.equal(answer.questionIndex, 2);
  assert.equal(answer.answer, 'B');
  assert.equal(answer.isCorrect, true);
  assert.equal(answer.score, 9);
});

test('saves legacy AI interview reports into InterviewSession history shape', async () => {
  const originalFindOneAndUpdate = InterviewSession.findOneAndUpdate;
  let capturedQuery;
  let capturedPayload;
  let capturedOptions;

  InterviewSession.findOneAndUpdate = async (query, payload, options) => {
    capturedQuery = query;
    capturedPayload = payload;
    capturedOptions = options;
    return { ...payload, _id: 'mock-session-id' };
  };

  try {
    const saved = await saveAiInterviewReport({
      userId: 'user-1',
      role: 'Backend Developer',
      difficulty: 'medium',
      duration: 12,
      source: 'gemini',
      sessionId: 'report-1',
      answers: [
        { question: 'Explain REST', answer: 'REST is an API style', category: 'API', score: 8 }
      ],
      report: {
        overallScore: 8,
        strengths: ['Clear basics'],
        improvements: ['Add examples'],
        recommendations: ['Practice API design'],
        summary: 'Good interview performance'
      }
    });

    assert.deepEqual(capturedQuery, { sessionId: 'report-1' });
    assert.equal(capturedOptions.upsert, true);
    assert.equal(capturedPayload.userId, 'user-1');
    assert.equal(capturedPayload.interviewType, 'ai-interview');
    assert.equal(capturedPayload.topic, 'Backend Developer');
    assert.equal(capturedPayload.totalQuestions, 1);
    assert.equal(capturedPayload.assessment.overallScore, 8);
    assert.equal(capturedPayload.assessment.summary, 'Good interview performance');
    assert.equal(saved.sessionId, 'report-1');
  } finally {
    InterviewSession.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
