const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCodingPrompt,
  buildMcqPrompt,
  cleanJsonResponse,
  normalizeQuestionCount
} = require('../controllers/practiceGenerationController.cjs');

test('cleans fenced JSON responses from AI providers', () => {
  const cleaned = cleanJsonResponse('```json\n[{"question":"Q?"}]\n```');
  assert.equal(cleaned, '[{"question":"Q?"}]');
});

test('normalizes generated MCQ count without changing route response shape', () => {
  const questions = normalizeQuestionCount([
    {
      question: 'What is React?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'React is a UI library.'
    }
  ], 3);

  assert.equal(questions.length, 3);
  assert.match(questions[1].question, /Variant 2/);
  assert.match(questions[2].question, /Variant 3/);
});

test('builds placement-focused AI prompts for MCQ and coding practice', () => {
  const mcqPrompt = buildMcqPrompt('JavaScript', 'medium', 5, 'session-1');
  const codingPrompt = buildCodingPrompt('arrays', 'easy', 'javascript', 'session-2');

  assert.match(mcqPrompt, /multiple choice questions/i);
  assert.match(mcqPrompt, /JavaScript language features/);
  assert.match(codingPrompt, /coding problem/i);
  assert.match(codingPrompt, /array manipulation/);
});
