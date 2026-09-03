const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getFeatureCapabilities,
  readBooleanEnv,
} = require('../config/capabilities.cjs');

const ENV_KEYS = [
  'NODE_ENV',
  'AI_PROVIDER',
  'USE_OLLAMA',
  'AI_FALLBACK_TO_CLOUD',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'ML_API_URL',
  'ENABLE_ML_FEATURES',
  'ENABLE_AI_AGENT_FEATURES',
  'SADTALKER_SERVICE_URL',
  'ENABLE_AVATAR_FEATURES',
];

const originalEnv = ENV_KEYS.reduce((acc, key) => {
  acc[key] = process.env[key];
  return acc;
}, {});

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
}

function withEnv(overrides, fn) {
  restoreEnv();

  for (const key of ENV_KEYS) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      if (overrides[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = overrides[key];
      }
    }
  }

  try {
    return fn();
  } finally {
    restoreEnv();
  }
}

test.afterEach(() => {
  restoreEnv();
});

test('readBooleanEnv parses common enabled and disabled values', () => {
  withEnv({ ENABLE_ML_FEATURES: 'yes' }, () => {
    assert.equal(readBooleanEnv('ENABLE_ML_FEATURES'), true);
  });

  withEnv({ ENABLE_ML_FEATURES: 'off' }, () => {
    assert.equal(readBooleanEnv('ENABLE_ML_FEATURES'), false);
  });

  withEnv({ ENABLE_ML_FEATURES: undefined }, () => {
    assert.equal(readBooleanEnv('ENABLE_ML_FEATURES', true), true);
  });
});

test('keeps ML and avatar unavailable until their services are configured', () => {
  withEnv({
    NODE_ENV: 'development',
    ML_API_URL: undefined,
    ENABLE_ML_FEATURES: undefined,
    SADTALKER_SERVICE_URL: undefined,
    ENABLE_AVATAR_FEATURES: undefined,
  }, () => {
    const capabilities = getFeatureCapabilities();

    assert.equal(capabilities.features.ml.available, false);
    assert.equal(capabilities.features.ml.status, 'coming-soon');
    assert.equal(capabilities.features.avatar.available, false);
    assert.equal(capabilities.features.avatar.status, 'coming-soon');
  });
});

test('enables ML and avatar when explicitly configured', () => {
  withEnv({
    NODE_ENV: 'development',
    ML_API_URL: 'http://localhost:5001',
    SADTALKER_SERVICE_URL: 'http://localhost:5002',
  }, () => {
    const capabilities = getFeatureCapabilities();

    assert.equal(capabilities.features.ml.available, true);
    assert.equal(capabilities.features.avatar.available, true);
  });
});

test('keeps AI agent hidden in production without Gemini or Groq', () => {
  withEnv({
    NODE_ENV: 'production',
    AI_PROVIDER: 'gemini',
    GEMINI_API_KEY: undefined,
    GROQ_API_KEY: undefined,
  }, () => {
    const capabilities = getFeatureCapabilities();

    assert.equal(capabilities.features.aiAgent.available, false);
    assert.equal(capabilities.features.aiAgent.status, 'coming-soon');
  });
});

test('requires explicit local Ollama or cloud provider for AI agent in development', () => {
  withEnv({
    NODE_ENV: 'development',
    AI_PROVIDER: undefined,
    USE_OLLAMA: undefined,
    GEMINI_API_KEY: undefined,
    GROQ_API_KEY: undefined,
  }, () => {
    const capabilities = getFeatureCapabilities();

    assert.equal(capabilities.features.aiAgent.available, false);
  });

  withEnv({
    NODE_ENV: 'development',
    USE_OLLAMA: 'true',
    GEMINI_API_KEY: undefined,
    GROQ_API_KEY: undefined,
  }, () => {
    const capabilities = getFeatureCapabilities();

    assert.equal(capabilities.features.aiAgent.available, true);
    assert.deepEqual(capabilities.features.aiAgent.details.demoReadyProviders, ['ollama']);
  });
});

test('enables AI agent in production when a cloud provider is configured', () => {
  withEnv({
    NODE_ENV: 'production',
    AI_PROVIDER: 'gemini',
    GEMINI_API_KEY: 'test-key',
    GROQ_API_KEY: undefined,
  }, () => {
    const capabilities = getFeatureCapabilities();

    assert.equal(capabilities.features.aiAgent.available, true);
    assert.deepEqual(capabilities.features.aiAgent.details.configuredProviders, ['gemini']);
  });
});
