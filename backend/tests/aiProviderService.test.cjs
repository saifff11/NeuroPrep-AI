const test = require('node:test');
const assert = require('node:assert/strict');

const aiProvider = require('../services/aiProviderService.cjs');

const ENV_KEYS = [
  'GEMINI_MODEL',
  'GEMINI_MODEL_CANDIDATES',
  'GEMINI_API_URL',
  'GROQ_MODEL',
  'GROQ_MODEL_CANDIDATES',
  'GROQ_API_URL',
];

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}

test.afterEach(restoreEnv);

test('prefers demo-safe Gemini Flash Lite before older unavailable model fallbacks', () => {
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_MODEL_CANDIDATES;

  const candidates = aiProvider._internals.getGeminiModelCandidates();

  assert.equal(candidates[0], 'gemini-flash-lite-latest');
  assert.ok(candidates.includes('gemini-2.5-flash'));
  assert.ok(candidates.indexOf('gemini-flash-lite-latest') < candidates.indexOf('gemini-2.5-flash'));
});

test('normalizes Gemini root and version URLs into generateContent endpoints', () => {
  process.env.GEMINI_API_URL = 'https://generativelanguage.googleapis.com';

  assert.equal(
    aiProvider._internals.getGeminiRequestUrls('gemini-flash-lite-latest')[0],
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'
  );

  process.env.GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

  assert.equal(
    aiProvider._internals.getGeminiRequestUrls('gemini-flash-lite-latest')[0],
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'
  );
});

test('prefers currently available Groq model candidates', () => {
  delete process.env.GROQ_MODEL;
  delete process.env.GROQ_MODEL_CANDIDATES;

  const candidates = aiProvider._internals.getGroqModelCandidates();

  assert.equal(candidates[0], 'groq/compound-mini');
  assert.ok(candidates.includes('qwen/qwen3.8-27b'));
});

test('strips complete Groq reasoning blocks and rejects reasoning-only output', () => {
  assert.equal(
    aiProvider._internals.stripReasoningBlocks('<think>private chain</think>\n{"ok":true}'),
    '{"ok":true}'
  );

  assert.equal(
    aiProvider._internals.stripReasoningBlocks('<think>private chain without final'),
    ''
  );
});
