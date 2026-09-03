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

const health = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/judge0/health`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.error || `Judge0 health check failed with ${response.status}`);
    }

    return {
      configured: Boolean(data.judge0?.configured),
      provider: data.judge0?.provider || 'none',
      providerPreference: data.judge0?.providerPreference || 'auto',
      baseUrl: data.judge0?.baseUrl || '',
      host: data.judge0?.host || '',
      localRunnerEnabled: Boolean(data.judge0?.localRunnerEnabled),
      supportedLocalLanguages: data.judge0?.supportedLocalLanguages || [],
      warning: data.judge0?.warning || null,
      error: null
    };
  } catch (error) {
    console.error('Judge0 health check failed:', error);
    return {
      configured: false,
      provider: 'none',
      providerPreference: 'auto',
      baseUrl: '',
      host: '',
      localRunnerEnabled: false,
      supportedLocalLanguages: [],
      warning: null,
      error: error.message || 'Failed to reach backend compiler service'
    };
  }
};

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

const judge0Client = { health, runOnce, runBatch };
export default judge0Client;
