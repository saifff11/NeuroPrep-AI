const axios = require('axios');
const ollamaService = require('./ollamaService.cjs');

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);

const DEFAULT_GEMINI_MODEL = 'gemini-flash-lite-latest';
const DEFAULT_GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GROQ_MODEL = 'groq/compound-mini';
const DEFAULT_GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GEMINI_FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

const GROQ_FALLBACK_MODELS = [
  'groq/compound-mini',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
];

function readCsvEnv(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function getGeminiModel() {
  return String(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
}

function getGroqModel() {
  return String(process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim();
}

function getGeminiModelCandidates(options = {}) {
  return uniqueValues([
    options.model,
    getGeminiModel(),
    ...readCsvEnv('GEMINI_MODEL_CANDIDATES'),
    ...GEMINI_FALLBACK_MODELS
  ]);
}

function getGroqModelCandidates(options = {}) {
  return uniqueValues([
    options.model,
    getGroqModel(),
    ...readCsvEnv('GROQ_MODEL_CANDIDATES'),
    ...GROQ_FALLBACK_MODELS
  ]);
}

function normalizeGeminiApiUrl(rawUrl, model) {
  const configuredUrl = String(rawUrl || '').trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    const cleanPath = url.pathname.replace(/\/+$/, '');

    if (!cleanPath || cleanPath === '/') {
      url.pathname = `/v1beta/models/${model}:generateContent`;
    } else if (/\/v1(beta)?$/i.test(cleanPath)) {
      url.pathname = `${cleanPath}/models/${model}:generateContent`;
    } else if (/\/models\/[^/]+:generateContent$/i.test(cleanPath)) {
      url.pathname = cleanPath.replace(/\/models\/[^/]+:generateContent$/i, `/models/${model}:generateContent`);
    } else if (!cleanPath.endsWith(':generateContent')) {
      return null;
    }

    url.search = '';
    return url.toString();
  } catch (error) {
    return null;
  }
}

function getGeminiRequestUrls(model) {
  const defaultUrl = `${DEFAULT_GEMINI_API_ROOT}/models/${model}:generateContent`;
  return uniqueValues([
    normalizeGeminiApiUrl(process.env.GEMINI_API_URL, model),
    defaultUrl
  ]);
}

function getGroqApiUrl() {
  const configuredUrl = String(process.env.GROQ_API_URL || '').trim();
  if (!configuredUrl) return DEFAULT_GROQ_API_URL;

  try {
    const url = new URL(configuredUrl);
    const cleanPath = url.pathname.replace(/\/+$/, '');

    if (!cleanPath || cleanPath === '/') {
      url.pathname = '/openai/v1/chat/completions';
    } else if (/\/openai\/v1$/i.test(cleanPath)) {
      url.pathname = `${cleanPath}/chat/completions`;
    } else if (!/\/chat\/completions$/i.test(cleanPath)) {
      return DEFAULT_GROQ_API_URL;
    }

    url.search = '';
    return url.toString();
  } catch (error) {
    return DEFAULT_GROQ_API_URL;
  }
}

function addGeminiApiKey(url) {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set('key', process.env.GEMINI_API_KEY);
  return requestUrl.toString();
}

function getSafeApiPath(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch (error) {
    return 'unknown';
  }
}

function getPrimaryProvider() {
  const explicitProvider = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (explicitProvider && explicitProvider !== 'auto') return explicitProvider;

  if (process.env.USE_OLLAMA === 'true') return 'ollama';
  if (process.env.NODE_ENV === 'production') return 'gemini';

  return 'ollama';
}

function getProviderSequence() {
  const primary = getPrimaryProvider();

  if (primary === 'gemini') return ['gemini', 'groq'];
  if (primary === 'groq') return ['groq', 'gemini'];
  if (primary === 'ollama') {
    const allowCloudFallback = process.env.AI_FALLBACK_TO_CLOUD === 'true';
    return allowCloudFallback ? ['ollama', 'gemini', 'groq'] : ['ollama'];
  }

  return process.env.NODE_ENV === 'production' ? ['gemini', 'groq'] : ['ollama'];
}

function isProviderConfigured(provider) {
  if (provider === 'ollama') return true;
  if (provider === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
  if (provider === 'groq') return Boolean(process.env.GROQ_API_KEY);
  return false;
}

function getModelForProvider(provider) {
  if (provider === 'ollama') return ollamaService.OLLAMA_MODEL;
  if (provider === 'gemini') return getGeminiModel();
  if (provider === 'groq') return getGroqModel();
  return 'unknown';
}

function normalizeAxiosError(error, provider, context = {}) {
  const status = error.response?.status || null;
  const retryAfter = error.response?.headers?.['retry-after'] || null;
  const modelLabel = context.model ? ` (${context.model})` : '';
  const upstreamMessage = error.response?.data?.error?.message ||
    error.response?.data?.message ||
    null;
  const message = status
    ? `${provider}${modelLabel} returned HTTP ${status}${upstreamMessage ? `: ${upstreamMessage}` : ''}`
    : error.code
      ? `${provider}${modelLabel} request failed: ${error.code}`
      : error.message || `${provider} request failed`;

  const normalized = new Error(message);
  normalized.status = status;
  normalized.retryAfter = retryAfter;
  normalized.provider = provider;
  normalized.model = context.model || null;
  normalized.apiPath = context.apiPath || null;
  normalized.upstreamBody = error.response?.data || null;
  return normalized;
}

function getTextFromGeminiResponse(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim() || '';
}

function stripReasoningBlocks(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  if (/^<think>/i.test(cleaned)) {
    return '';
  }

  return cleaned;
}

async function callOllama(prompt, options = {}) {
  const text = await ollamaService.generateCompletion(prompt, options);
  return {
    text,
    provider: 'ollama',
    model: options.model || ollamaService.OLLAMA_MODEL
  };
}

async function callGemini(prompt, options = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const generationConfig = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxTokens || options.maxOutputTokens || 4000
  };

  if (Array.isArray(options.stop) && options.stop.length > 0) {
    generationConfig.stopSequences = options.stop;
  }

  if (options.format === 'json') {
    generationConfig.responseMimeType = 'application/json';
  }

  let lastError = null;
  const modelCandidates = getGeminiModelCandidates(options);

  for (const model of modelCandidates) {
    const requestUrls = getGeminiRequestUrls(model);

    for (const requestUrl of requestUrls) {
      try {
        const response = await axios.post(
          addGeminiApiKey(requestUrl),
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: options.timeout || REQUEST_TIMEOUT
          }
        );

        const text = getTextFromGeminiResponse(response.data);
        if (!text) throw new Error('Gemini returned an empty response');

        return {
          text,
          provider: 'gemini',
          model
        };
      } catch (error) {
        lastError = error.response
          ? normalizeAxiosError(error, 'gemini', { model, apiPath: getSafeApiPath(requestUrl) })
          : error;

        if (lastError.status === 401 || lastError.status === 403) {
          throw lastError;
        }
      }
    }
  }

  throw lastError || new Error('Gemini request failed');
}

async function callGroq(prompt, options = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  let lastError = null;
  const modelCandidates = getGroqModelCandidates(options);
  const apiUrl = getGroqApiUrl();

  for (const model of modelCandidates) {
    try {
      const response = await axios.post(
        apiUrl,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens || options.maxOutputTokens || 4000,
          stop: Array.isArray(options.stop) && options.stop.length > 0 ? options.stop : undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`
          },
          timeout: options.timeout || REQUEST_TIMEOUT
        }
      );

      const text = stripReasoningBlocks(response.data?.choices?.[0]?.message?.content || '');
      if (!text) throw new Error('Groq returned an empty response');

      return {
        text,
        provider: 'groq',
        model
      };
    } catch (error) {
      lastError = error.response
        ? normalizeAxiosError(error, 'groq', { model, apiPath: getSafeApiPath(apiUrl) })
        : error;

      if (lastError.status === 401 || lastError.status === 403) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Groq request failed');
}

async function callProvider(provider, prompt, options) {
  if (provider === 'ollama') return callOllama(prompt, options);
  if (provider === 'gemini') return callGemini(prompt, options);
  if (provider === 'groq') return callGroq(prompt, options);
  throw new Error(`Unsupported AI provider: ${provider}`);
}

function buildProviderFailureError(errors, providerFailures) {
  const error = new Error(`No AI provider completed the request. Tried: ${errors.join(' | ')}`);
  error.providerFailures = providerFailures;

  const lastFailure = providerFailures[providerFailures.length - 1];
  if (lastFailure) {
    error.status = lastFailure.status;
    error.retryAfter = lastFailure.retryAfter;
    error.upstreamBody = lastFailure.upstreamBody;
  }

  return error;
}

async function generateText(prompt, options = {}) {
  const sequence = getProviderSequence();
  const errors = [];
  const providerFailures = [];

  for (const provider of sequence) {
    if (!isProviderConfigured(provider)) {
      errors.push(`${provider}: not configured`);
      continue;
    }

    try {
      const result = await callProvider(provider, prompt, options);
      return {
        ...result,
        source: `${result.provider}:${result.model}`,
        fallbackUsed: provider !== sequence[0]
      };
    } catch (error) {
      const statusLabel = error.status ? ` HTTP ${error.status}` : '';
      errors.push(`${provider}:${statusLabel} ${error.message}`.trim());
      providerFailures.push({
        provider,
        status: error.status || null,
        retryAfter: error.retryAfter || null,
        model: error.model || null,
        apiPath: error.apiPath || null,
        message: error.message,
        upstreamBody: error.upstreamBody || null
      });
      console.warn(`AI provider ${provider} failed${statusLabel}; ${provider === 'gemini' ? 'checking fallback provider' : 'no response from provider'}`);
    }
  }

  throw buildProviderFailureError(errors, providerFailures);
}

async function chatText(messages, options = {}) {
  const prompt = messages
    .map(message => `${String(message.role || 'user').toUpperCase()}: ${message.content || ''}`)
    .join('\n\n');

  return generateText(prompt, options);
}

async function checkHealth() {
  const sequence = getProviderSequence();
  const ollamaRunning = await ollamaService.checkHealth();

  return {
    primaryProvider: getPrimaryProvider(),
    providerSequence: sequence,
    providers: {
      ollama: {
        configured: true,
        running: ollamaRunning,
        url: ollamaService.OLLAMA_API_URL,
        model: ollamaService.OLLAMA_MODEL
      },
      gemini: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: getGeminiModel(),
        candidates: getGeminiModelCandidates(),
        endpointReady: getGeminiRequestUrls(getGeminiModel()).length > 0
      },
      groq: {
        configured: Boolean(process.env.GROQ_API_KEY),
        model: getGroqModel(),
        candidates: getGroqModelCandidates(),
        endpointReady: Boolean(getGroqApiUrl())
      }
    }
  };
}

function getConfig() {
  return {
    primaryProvider: getPrimaryProvider(),
    providerSequence: getProviderSequence(),
    primaryModel: getModelForProvider(getPrimaryProvider()),
    models: {
      ollama: ollamaService.OLLAMA_MODEL,
      gemini: getGeminiModel(),
      groq: getGroqModel()
    },
    modelCandidates: {
      gemini: getGeminiModelCandidates(),
      groq: getGroqModelCandidates()
    }
  };
}

module.exports = {
  generateText,
  generateCompletion: async (prompt, options = {}) => (await generateText(prompt, options)).text,
  chatText,
  checkHealth,
  getConfig,
  getPrimaryProvider,
  getProviderSequence,
  isProviderConfigured,
  parseJsonResponse: ollamaService.parseJsonResponse,
  parsePlainTextToJson: ollamaService.parsePlainTextToJson,
  _internals: {
    getGeminiModelCandidates,
    getGeminiRequestUrls,
    getGroqApiUrl,
    getGroqModelCandidates,
    normalizeGeminiApiUrl,
    stripReasoningBlocks
  }
};
