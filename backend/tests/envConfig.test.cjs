const test = require('node:test');
const assert = require('node:assert/strict');

const { getMissingEnv, hasServerCodeRunner } = require('../config/env.cjs');

const ENV_KEYS = [
  'NODE_ENV',
  'MONGODB_URI',
  'DATABASE_URL',
  'MONGO_URI',
  'MONGO_URL',
  'MONGODB_URL',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'JWT_SECRET',
  'ADMIN_SECRET',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_SERVICE_ACCOUNT_BASE64',
  'FIREBASE_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'CODE_RUNNER_PROVIDER',
  'LOCAL_CODE_RUNNER_ENABLED',
  'JUDGE0_URL',
  'JUDGE0_BASE_URL',
  'JUDGE0_API_KEY',
  'RAPIDAPI_KEY'
];

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}

function withEnv(overrides, fn) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, overrides);

  try {
    return fn();
  } finally {
    restoreEnv();
  }
}

test.afterEach(restoreEnv);

test('accepts explicitly enabled local code runner as a server code runner', () => {
  withEnv({ CODE_RUNNER_PROVIDER: 'local', LOCAL_CODE_RUNNER_ENABLED: 'true' }, () => {
    assert.equal(hasServerCodeRunner(), true);
  });
});

test('does not require paid Judge0 key when production has a code runner', () => {
  withEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://localhost:27017/neuroprep',
    GEMINI_API_KEY: 'test-gemini',
    GROQ_API_KEY: 'test-groq',
    JWT_SECRET: 'test-secret',
    FIREBASE_PROJECT_ID: 'test-project',
    CODE_RUNNER_PROVIDER: 'local',
    LOCAL_CODE_RUNNER_ENABLED: 'true'
  }, () => {
    const missing = getMissingEnv();

    assert.equal(missing.some((item) => item.includes('JUDGE0_API_KEY')), false);
    assert.equal(missing.some((item) => item.includes('CODE_RUNNER_PROVIDER')), false);
  });
});
