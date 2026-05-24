const axios = require('axios');
const ollamaService = require('./ollamaService.cjs');

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
const GEMINI_API_URL = process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

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
  if (provider === 'gemini') return GEMINI_MODEL;
  if (provider === 'groq') return GROQ_MODEL;
  return 'unknown';
}

function normalizeAxiosError(error, provider) {
  const status = error.response?.status || null;
  const retryAfter = error.response?.headers?.['retry-after'] || null;
  const message = status
    ? `${provider} returned HTTP ${status}`
    : error.code
      ? `${provider} request failed: ${error.code}`
      : error.message || `${provider} request failed`;

  const normalized = new Error(message);
  normalized.status = status;
  normalized.retryAfter = retryAfter;
  normalized.provider = provider;
  normalized.upstreamBody = error.response?.data || null;
  return normalized;
}

function getTextFromGeminiResponse(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim() || '';
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
    generationConfig.response_mime_type = 'application/json';
  }

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
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
      model: GEMINI_MODEL
    };
  } catch (error) {
    if (error.response) throw normalizeAxiosError(error, 'gemini');
    throw error;
  }
}

async function callGroq(prompt, options = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: options.model || GROQ_MODEL,
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

    const text = response.data?.choices?.[0]?.message?.content?.trim() || '';
    if (!text) throw new Error('Groq returned an empty response');

    return {
      text,
      provider: 'groq',
      model: options.model || GROQ_MODEL
    };
  } catch (error) {
    if (error.response) throw normalizeAxiosError(error, 'groq');
    throw error;
  }
}

async function callProvider(provider, prompt, options) {
  if (provider === 'ollama') return callOllama(prompt, options);
  if (provider === 'gemini') return callGemini(prompt, options);
  if (provider === 'groq') return callGroq(prompt, options);
  throw new Error(`Unsupported AI provider: ${provider}`);
}

async function generateText(prompt, options = {}) {
  const sequence = getProviderSequence();
  const errors = [];

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
      console.warn(`AI provider ${provider} failed${statusLabel}; ${provider === 'gemini' ? 'checking fallback provider' : 'no response from provider'}`);
    }
  }

  throw new Error(`No AI provider completed the request. Tried: ${errors.join(' | ')}`);
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
        model: GEMINI_MODEL
      },
      groq: {
        configured: Boolean(process.env.GROQ_API_KEY),
        model: GROQ_MODEL
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
      gemini: GEMINI_MODEL,
      groq: GROQ_MODEL
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
  parsePlainTextToJson: ollamaService.parsePlainTextToJson
};
