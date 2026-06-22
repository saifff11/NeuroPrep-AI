const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function postJudge0(path, payload) {
  const response = await fetch(`${API_BASE}/api/judge0${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.details || `Judge0 request failed with ${response.status}`);
  }

  return data.result;
}

const runOnce = async ({ code, languageId, stdin = '' }) => {
  try {
    return await postJudge0('/run', { code, languageId, stdin });
  } catch (error) {
    console.error('Judge0 backend proxy error:', error);
    return {
      status: { description: 'Network Error' },
      compile_output: error.message,
      stdout: '',
      stderr: 'Failed to connect to backend compilation service'
    };
  }
};

const runBatch = async ({ code, languageId, testCases = [] }) => {
  try {
    return await postJudge0('/run-batch', { code, languageId, testCases });
  } catch (error) {
    console.error('Judge0 batch proxy error:', error);
    return {
      passed: 0,
      total: testCases.length,
      details: testCases.map((testCase) => ({
        input: testCase.input,
        expected: testCase.output,
        actual: null,
        passed: false,
        time: 0,
        memory: 0,
        compile_output: null,
        stderr: null,
        error: error.message
      })),
      metrics: {
        avgTime: 0,
        maxMemory: 0
      }
    };
  }
};

const judge0Client = { runOnce, runBatch };
export default judge0Client;
