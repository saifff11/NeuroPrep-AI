const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getConfig,
  normalizeTestCase
} = require('../services/judge0Service.cjs');

test('normalizes string and object test cases for Judge0 stdin/output', () => {
  assert.deepEqual(normalizeTestCase({ input: '1 2', output: '3' }), {
    stdin: '1 2',
    expected: '3'
  });

  assert.deepEqual(normalizeTestCase({ input: [1, 2, 3], output: { sum: 6 } }), {
    stdin: '[1,2,3]',
    expected: '{"sum":6}'
  });
});

test('reports Judge0 backend configuration without exposing keys', () => {
  const config = getConfig();

  assert.equal(typeof config.configured, 'boolean');
  assert.equal(typeof config.baseUrl, 'string');
  assert.equal(typeof config.host, 'string');
  assert.equal(Object.prototype.hasOwnProperty.call(config, 'apiKey'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(config, 'key'), false);
});
