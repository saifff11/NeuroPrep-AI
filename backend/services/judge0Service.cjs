const axios = require('axios');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const DEFAULT_JUDGE0_BASE_URL = 'https://judge0-ce.p.rapidapi.com';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_CODE_SIZE_LIMIT = 64 * 1024;
const DEFAULT_OUTPUT_LIMIT = 128 * 1024;

const RUNNERS = {
  50: {
    name: 'c',
    filename: 'main.c',
    executable: process.platform === 'win32' ? 'main.exe' : 'main',
    compile: ({ filePath, executablePath }) => ['gcc', [filePath, '-std=c11', '-O2', '-o', executablePath]]
  },
  54: {
    name: 'cpp',
    filename: 'main.cpp',
    executable: process.platform === 'win32' ? 'main.exe' : 'main',
    compile: ({ filePath, executablePath }) => ['g++', [filePath, '-std=c++17', '-O2', '-o', executablePath]]
  },
  62: {
    name: 'java',
    filename: 'Main.java',
    compile: ({ filePath }) => ['javac', [filePath]],
    run: ({ workDir }) => ['java', ['-cp', workDir, 'Main']]
  },
  63: {
    name: 'javascript',
    filename: 'main.js',
    run: ({ filePath }) => [process.execPath, [filePath]]
  },
  71: {
    name: 'python',
    filename: 'main.py',
    run: ({ filePath }) => [process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3'), [filePath]]
  }
};

function readBooleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function readConfig() {
  const rawBaseUrl = process.env.JUDGE0_URL || process.env.JUDGE0_BASE_URL || DEFAULT_JUDGE0_BASE_URL;
  const baseUrl = String(rawBaseUrl).replace(/\/+$/, '');
  const apiKey = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY || '';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const providerPreference = String(process.env.CODE_RUNNER_PROVIDER || 'auto').toLowerCase();
  const isRapidApi = /rapidapi/i.test(baseUrl);
  const host = process.env.JUDGE0_API_HOST || (isRapidApi ? 'judge0-ce.p.rapidapi.com' : '');
  const hasSelfHostedJudge0 = Boolean(process.env.JUDGE0_URL || process.env.JUDGE0_BASE_URL) && !isRapidApi;
  const localRunnerEnabled = readBooleanEnv(
    process.env.LOCAL_CODE_RUNNER_ENABLED,
    nodeEnv !== 'production'
  );

  let provider = 'none';
  if (providerPreference === 'local') {
    provider = localRunnerEnabled ? 'local' : 'none';
  } else if (providerPreference === 'judge0' || providerPreference === 'self-hosted') {
    provider = apiKey || hasSelfHostedJudge0 ? 'judge0' : 'none';
  } else if (nodeEnv !== 'production' && localRunnerEnabled && !apiKey) {
    provider = 'local';
  } else if (apiKey || hasSelfHostedJudge0) {
    provider = 'judge0';
  } else if (localRunnerEnabled) {
    provider = 'local';
  }

  return {
    provider,
    providerPreference,
    configured: provider !== 'none',
    baseUrl,
    host,
    apiKey,
    isRapidApi,
    localRunnerEnabled,
    timeoutMs: Number(process.env.CODE_RUNNER_TIMEOUT_MS || process.env.JUDGE0_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    codeSizeLimit: Number(process.env.CODE_RUNNER_MAX_CODE_BYTES || DEFAULT_CODE_SIZE_LIMIT)
  };
}

function getJudge0Headers(config = readConfig()) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['X-RapidAPI-Key'] = config.apiKey;
    headers['X-RapidAPI-Host'] = config.host;
  }
  return headers;
}

function configurationError() {
  return {
    status: { description: 'Configuration Error' },
    compile_output: [
      'No code runner is configured.',
      'Use free self-hosted Judge0 with JUDGE0_URL=http://localhost:2358,',
      'or enable the local development runner with LOCAL_CODE_RUNNER_ENABLED=true.'
    ].join(' '),
    stdout: '',
    stderr: 'Missing code runner configuration'
  };
}

function createStatus(description) {
  return { description };
}

function getSafeEnv() {
  return {
    PATH: process.env.PATH || '',
    Path: process.env.Path || process.env.PATH || '',
    SystemRoot: process.env.SystemRoot || 'C:\\Windows',
    TEMP: os.tmpdir(),
    TMP: os.tmpdir()
  };
}

function runProcess(command, args, options = {}) {
  const { cwd, stdin = '', timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const startedAt = process.hrtime.bigint();

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let outputExceeded = false;
    let finished = false;

    const child = spawn(command, args, {
      cwd,
      env: getSafeEnv(),
      windowsHide: true
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    const done = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const elapsedNs = Number(process.hrtime.bigint() - startedAt);
      resolve({
        stdout,
        stderr,
        timedOut,
        outputExceeded,
        time: elapsedNs / 1e9,
        ...result
      });
    };

    const appendOutput = (target, chunk) => {
      const next = target + chunk.toString();
      if (next.length > DEFAULT_OUTPUT_LIMIT) {
        outputExceeded = true;
        child.kill('SIGKILL');
        return next.slice(0, DEFAULT_OUTPUT_LIMIT);
      }
      return next;
    };

    child.stdout.on('data', (chunk) => {
      stdout = appendOutput(stdout, chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr = appendOutput(stderr, chunk);
    });

    child.stdin.on('error', () => {});

    child.on('error', (error) => {
      done({
        exitCode: null,
        error
      });
    });

    child.on('close', (exitCode) => {
      done({ exitCode });
    });

    try {
      if (stdin) child.stdin.write(stdin);
      child.stdin.end();
    } catch (_error) {}
  });
}

function missingRuntimeResult(languageName, error) {
  return {
    status: createStatus('Configuration Error'),
    compile_output: `${languageName} runner is not installed or not available in PATH.`,
    stdout: '',
    stderr: error?.message || 'Runtime not found',
    time: 0,
    memory: 0
  };
}

async function runLocalOnce({ code, languageId, stdin = '' }, config = readConfig()) {
  const runner = RUNNERS[Number(languageId)];
  if (!runner) {
    return {
      status: createStatus('Unsupported Language'),
      compile_output: `Local runner does not support languageId ${languageId}.`,
      stdout: '',
      stderr: 'Unsupported language',
      time: 0,
      memory: 0
    };
  }

  if (Buffer.byteLength(String(code || ''), 'utf8') > config.codeSizeLimit) {
    return {
      status: createStatus('Compilation Error'),
      compile_output: `Code is too large. Limit is ${config.codeSizeLimit} bytes.`,
      stdout: '',
      stderr: 'Code size limit exceeded',
      time: 0,
      memory: 0
    };
  }

  const runId = `neuroprep-code-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const workDir = path.join(os.tmpdir(), runId);
  await fs.mkdir(workDir, { recursive: true });

  try {
    const filePath = path.join(workDir, runner.filename);
    const executablePath = runner.executable ? path.join(workDir, runner.executable) : null;
    await fs.writeFile(filePath, String(code || ''), 'utf8');

    if (runner.compile) {
      const [compileCommand, compileArgs] = runner.compile({ filePath, executablePath, workDir });
      const compileResult = await runProcess(compileCommand, compileArgs, {
        cwd: workDir,
        timeoutMs: config.timeoutMs
      });

      if (compileResult.error) {
        return missingRuntimeResult(runner.name, compileResult.error);
      }

      if (compileResult.timedOut) {
        return {
          status: createStatus('Time Limit Exceeded'),
          compile_output: 'Compilation timed out.',
          stdout: compileResult.stdout,
          stderr: compileResult.stderr,
          time: compileResult.time,
          memory: 0
        };
      }

      if (compileResult.outputExceeded) {
        return {
          status: createStatus('Compilation Error'),
          compile_output: 'Compilation output exceeded the limit.',
          stdout: compileResult.stdout,
          stderr: compileResult.stderr || 'Output limit exceeded.',
          time: compileResult.time,
          memory: 0
        };
      }

      if (compileResult.exitCode !== 0) {
        return {
          status: createStatus('Compilation Error'),
          compile_output: compileResult.stderr || compileResult.stdout || 'Compilation failed.',
          stdout: compileResult.stdout,
          stderr: compileResult.stderr,
          time: compileResult.time,
          memory: 0
        };
      }
    }

    const runCommandFactory = runner.run || (() => [executablePath, []]);
    const [runCommand, runArgs] = runCommandFactory({ filePath, executablePath, workDir });
    const runResult = await runProcess(runCommand, runArgs, {
      cwd: workDir,
      stdin,
      timeoutMs: config.timeoutMs
    });

    if (runResult.error) {
      return missingRuntimeResult(runner.name, runResult.error);
    }

    if (runResult.timedOut) {
      return {
        status: createStatus('Time Limit Exceeded'),
        compile_output: '',
        stdout: runResult.stdout,
        stderr: runResult.stderr || 'Execution timed out.',
        time: runResult.time,
        memory: 0
      };
    }

    if (runResult.outputExceeded) {
      return {
        status: createStatus('Runtime Error'),
        compile_output: '',
        stdout: runResult.stdout,
        stderr: runResult.stderr || 'Output limit exceeded.',
        time: runResult.time,
        memory: 0
      };
    }

    return {
      status: createStatus(runResult.exitCode === 0 ? 'Accepted' : 'Runtime Error'),
      compile_output: '',
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      time: runResult.time,
      memory: 0,
      runner: 'local'
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

async function runJudge0Once({ code, languageId, stdin = '' }, config = readConfig()) {
  if (config.isRapidApi && !config.apiKey) return configurationError();

  try {
    const response = await axios.post(
      `${config.baseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin
      },
      {
        headers: getJudge0Headers(config),
        timeout: config.timeoutMs
      }
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return {
        status: createStatus('Authentication Error'),
        compile_output: 'Judge0 authentication failed. Check the backend Judge0 configuration.',
        stdout: '',
        stderr: 'Authentication failed'
      };
    }
    if (status === 429) {
      return {
        status: createStatus('Rate Limit Exceeded'),
        compile_output: 'Judge0 rate limit exceeded. Please wait and retry.',
        stdout: '',
        stderr: 'Rate limit exceeded'
      };
    }

    return {
      status: createStatus('Network Error'),
      compile_output: error.message,
      stdout: '',
      stderr: 'Failed to connect to Judge0'
    };
  }
}

async function runOnce({ code, languageId, stdin = '' }) {
  const config = readConfig();
  if (config.provider === 'local') {
    return runLocalOnce({ code, languageId, stdin }, config);
  }
  if (config.provider === 'judge0') {
    return runJudge0Once({ code, languageId, stdin }, config);
  }
  return configurationError();
}

function normalizeTestCase(testCase = {}) {
  const stdin = testCase.input !== undefined
    ? (typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input))
    : '';
  const expectedValue = testCase.output ?? testCase.expected ?? testCase.expectedOutput;
  const expected = expectedValue !== undefined
    ? (typeof expectedValue === 'string' ? expectedValue : JSON.stringify(expectedValue))
    : null;

  return {
    stdin,
    expected,
    hidden: Boolean(testCase.hidden || testCase.isHidden),
    explanation: testCase.explanation || testCase.hint || null
  };
}

async function runBatch({ code, languageId, testCases = [] }) {
  const details = [];
  let passed = 0;
  let totalTime = 0;
  let maxMemory = 0;

  for (const testCase of testCases) {
    const { stdin, expected, hidden, explanation } = normalizeTestCase(testCase);
    const result = await runOnce({ code, languageId, stdin });
    const actual = result.stdout ?? '';
    const time = result.time ? Number(result.time) : Number(result.time_used || 0);
    const memory = result.memory ? Number(result.memory) : Number(result.memory_used || 0);
    const statusDescription = result.status?.description || '';
    const isAcceptedStatus = String(statusDescription).toLowerCase() === 'accepted';
    const isPassed = isAcceptedStatus && expected !== null ? String(actual).trim() === String(expected).trim() : false;

    if (isPassed) passed += 1;
    totalTime += time || 0;
    if (memory && memory > maxMemory) maxMemory = memory;

    details.push({
      input: testCase.input,
      expected,
      actual,
      passed: isPassed,
      hidden,
      explanation,
      time,
      memory,
      compile_output: result.compile_output,
      stderr: result.stderr,
      status: statusDescription,
      classification: statusDescription,
      error: statusDescription.toLowerCase().includes('error') ? statusDescription : null
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
  const config = readConfig();
  return {
    configured: config.configured,
    provider: config.provider,
    providerPreference: config.providerPreference,
    baseUrl: config.baseUrl,
    host: config.host,
    localRunnerEnabled: config.localRunnerEnabled,
    timeoutMs: config.timeoutMs,
    supportedLocalLanguages: Object.values(RUNNERS).map((runner) => runner.name),
    warning: config.provider === 'local'
      ? 'Local runner is for development/demo only. Do not expose it as a public production sandbox.'
      : null
  };
}

module.exports = {
  runOnce,
  runBatch,
  normalizeTestCase,
  getConfig,
  readConfig,
  runLocalOnce
};
