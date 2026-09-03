const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeInterviewQuestionText
} = require('../controllers/interviewController.cjs');

test('removes private interview seed text from generated questions', () => {
  const cleaned = sanitizeInterviewQuestionText(
    'Can you describe a team project where you integrated services, as inspired by the interview_1785415259305_HKCrhW1uA9SekcDKCIVFRUOM8C13-1-1785415259466-xx9ved seed?'
  );

  assert.equal(
    cleaned,
    'Can you describe a team project where you integrated services?'
  );
  assert.doesNotMatch(cleaned, /interview_/);
  assert.doesNotMatch(cleaned, /seed/i);
});
