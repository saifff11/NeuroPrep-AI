const axios = require('axios');

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

function getJudge0Headers() {
  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = JUDGE0_API_HOST;
  }
  return headers;
}

function configurationError() {
  return {
    status: { description: 'Configuration Error' },
    compile_output: 'Judge0 API key is not configured on the backend. Set JUDGE0_API_KEY or RAPIDAPI_KEY.',
    stdout: '',
    stderr: 'Missing backend Judge0 API key'
  };
}

async function runOnce({ code, languageId, stdin = '' }) {
  if (!JUDGE0_API_KEY) return configurationError();

  try {
    const response = await axios.post(
      `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin
      },
      {
        headers: getJudge0Headers(),
        timeout: Number(process.env.JUDGE0_TIMEOUT_MS || 30000)
      }
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return {
        status: { description: 'Authentication Error' },
        compile_output: 'Judge0 authentication failed. Check the backend Judge0 API key.',
        stdout: '',
        stderr: 'Authentication failed'
      };
    }
    if (status === 429) {
      return {
        status: { description: 'Rate Limit Exceeded' },
        compile_output: 'Judge0 rate limit exceeded. Please wait and retry.',
        stdout: '',
        stderr: 'Rate limit exceeded'
      };
    }

    return {
      status: { description: 'Network Error' },
      compile_output: error.message,
      stdout: '',
      stderr: 'Failed to connect to Judge0'
    };
  }
}

function normalizeTestCase(testCase = {}) {
  const stdin = testCase.input !== undefined
    ? (typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input))
    : '';
  const expected = testCase.output !== undefined
    ? (typeof testCase.output === 'string' ? testCase.output : JSON.stringify(testCase.output))
    : null;

  return { stdin, expected };
}

async function runBatch({ code, languageId, testCases = [] }) {
  const details = [];
  let passed = 0;
  let totalTime = 0;
  let maxMemory = 0;

  for (const testCase of testCases) {
    const { stdin, expected } = normalizeTestCase(testCase);
    const result = await runOnce({ code, languageId, stdin });
    const actual = result.stdout ?? '';
    const time = result.time ? Number(result.time) : Number(result.time_used || 0);
    const memory = result.memory ? Number(result.memory) : Number(result.memory_used || 0);
    const isPassed = expected !== null ? String(actual).trim() === String(expected).trim() : false;

    if (isPassed) passed += 1;
    totalTime += time || 0;
    if (memory && memory > maxMemory) maxMemory = memory;

    details.push({
      input: testCase.input,
      expected,
      actual,
      passed: isPassed,
      time,
      memory,
      compile_output: result.compile_output,
      stderr: result.stderr,
      error: result.status?.description?.toLowerCase().includes('error') ? result.status.description : null
    });
  }

  return {
    passed,
    total: testCases.length,
    details,
    metrics: {
      avgTime: details.length ? totalTime / details.length : 0,
      maxMemory
    }
  };
}

function getConfig() {
  return {
    configured: Boolean(JUDGE0_API_KEY),
    baseUrl: JUDGE0_BASE_URL,
    host: JUDGE0_API_HOST
  };
}

module.exports = {
  runOnce,
  runBatch,
  normalizeTestCase,
  getConfig
};
