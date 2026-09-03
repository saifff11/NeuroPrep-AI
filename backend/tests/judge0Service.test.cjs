const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getConfig,
  readConfig,
  normalizeTestCase
} = require('../services/judge0Service.cjs');

function withEnv(overrides, fn) {
  const keys = [
    'NODE_ENV',
    'CODE_RUNNER_PROVIDER',
    'LOCAL_CODE_RUNNER_ENABLED',
    'JUDGE0_URL',
    'JUDGE0_BASE_URL',
    'JUDGE0_API_KEY',
    'RAPIDAPI_KEY'
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  for (const key of keys) delete process.env[key];
  Object.assign(process.env, overrides);

  try {
    fn();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('normalizes string and object test cases for Judge0 stdin/output', () => {
  assert.deepEqual(normalizeTestCase({ input: '1 2', output: '3' }), {
    stdin: '1 2',
    expected: '3',
    hidden: false,
    explanation: null
  });

  assert.deepEqual(normalizeTestCase({ input: [1, 2, 3], output: { sum: 6 } }), {
    stdin: '[1,2,3]',
    expected: '{"sum":6}',
    hidden: false,
    explanation: null
  });

  assert.deepEqual(normalizeTestCase({ input: '9', expectedOutput: '81', hidden: true, explanation: 'square it' }), {
    stdin: '9',
    expected: '81',
    hidden: true,
    explanation: 'square it'
  });
});

test('reports Judge0 backend configuration without exposing keys', () => {
  const config = getConfig();

  assert.equal(typeof config.configured, 'boolean');
  assert.equal(typeof config.provider, 'string');
  assert.equal(typeof config.baseUrl, 'string');
  assert.equal(typeof config.host, 'string');
  assert.equal(Object.prototype.hasOwnProperty.call(config, 'apiKey'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(config, 'key'), false);
});

test('uses free local code runner in development when no Judge0 key exists', () => {
  withEnv({ NODE_ENV: 'development' }, () => {
    const config = readConfig();

    assert.equal(config.provider, 'local');
    assert.equal(config.configured, true);
    assert.equal(config.localRunnerEnabled, true);
  });
});

test('auto mode prefers local runner in development even with stale Judge0 URL', () => {
  withEnv({ NODE_ENV: 'development', JUDGE0_URL: 'http://localhost:2358' }, () => {
    const config = readConfig();

    assert.equal(config.provider, 'local');
    assert.equal(config.configured, true);
  });
});

test('explicit Judge0 mode can use self-hosted Judge0 in development', () => {
  withEnv({ NODE_ENV: 'development', CODE_RUNNER_PROVIDER: 'judge0', JUDGE0_URL: 'http://localhost:2358' }, () => {
    const config = readConfig();

    assert.equal(config.provider, 'judge0');
    assert.equal(config.configured, true);
  });
});

test('does not enable local code execution by default in production', () => {
  withEnv({ NODE_ENV: 'production' }, () => {
    const config = readConfig();

    assert.equal(config.provider, 'none');
    assert.equal(config.configured, false);
    assert.equal(config.localRunnerEnabled, false);
  });
});

test('supports self-hosted Judge0 without RapidAPI key', () => {
  withEnv({ NODE_ENV: 'production', JUDGE0_URL: 'http://localhost:2358' }, () => {
    const config = readConfig();

    assert.equal(config.provider, 'judge0');
    assert.equal(config.configured, true);
    assert.equal(config.apiKey, '');
  });
});
