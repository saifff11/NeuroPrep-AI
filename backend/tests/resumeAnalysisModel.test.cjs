const test = require('node:test');
const assert = require('node:assert/strict');

const ResumeAnalysis = require('../models/ResumeAnalysis.cjs');

function makeBaseAnalysis(overrides = {}) {
  return {
    analysisId: `resume_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: 'test-user',
    targetRole: 'Backend Developer',
    atsScore: 68,
    jobMatchScore: 60,
    placementReadinessScore: 65,
    ...overrides
  };
}

test('validates object-shaped resume interview questions', async () => {
  const analysis = new ResumeAnalysis(makeBaseAnalysis({
    interviewQuestions: [
      {
        topic: 'Spring Boot',
        difficulty: 'medium',
        type: 'skill-gap',
        question: 'How would you apply Spring Boot in a Backend Developer project?'
      }
    ]
  }));

  await assert.doesNotReject(() => analysis.validate());
  assert.equal(analysis.interviewQuestions[0].topic, 'Spring Boot');
  assert.equal(analysis.interviewQuestions[0].question.includes('Spring Boot'), true);
});

test('normalizes legacy string resume interview questions before validation', async () => {
  const analysis = new ResumeAnalysis(makeBaseAnalysis({
    interviewQuestions: [
      'How would you explain Docker in a backend interview?'
    ]
  }));

  await assert.doesNotReject(() => analysis.validate());
  assert.equal(analysis.interviewQuestions[0].topic, 'Resume Gap');
  assert.equal(analysis.interviewQuestions[0].difficulty, 'medium');
  assert.equal(analysis.interviewQuestions[0].question, 'How would you explain Docker in a backend interview?');
});
