const test = require('node:test');
const assert = require('node:assert/strict');
const Submission = require('../models/Submission.cjs');

test('practice compiler submissions validate without contest or problem ids', async () => {
  const doc = new Submission({
    userId: 'firebase-user-1',
    problemKey: 'practice-programming-logic',
    problemTitle: 'Programming Logic Coding Warm-up',
    topic: 'Programming Logic',
    difficulty: 'medium',
    source: 'practice',
    code: 'public class Main {}',
    language: 'java',
    status: 'wrong_answer',
    verdict: 'Wrong Answer',
    testResults: [
      {
        input: '5\n1 2 3 4 5',
        expected: '15 5',
        actual: 'wrong output',
        passed: false,
        status: 'Wrong Answer'
      }
    ],
    totalTestCases: 1,
    passedTestCases: 0
  });

  await assert.doesNotReject(() => doc.validate());
  assert.equal(doc.contestId, null);
  assert.equal(doc.problemId, null);
  assert.equal(doc.problemTitle, 'Programming Logic Coding Warm-up');
});
