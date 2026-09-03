const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://neuro-prep-ai.vercel.app',
  'https://www.neuro-prep-ai.vercel.app'
];

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readBooleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function hasServerCodeRunner() {
  const provider = String(process.env.CODE_RUNNER_PROVIDER || 'auto').toLowerCase();
  const judge0Url = process.env.JUDGE0_URL || process.env.JUDGE0_BASE_URL || '';
  const hasRapidApiKey = Boolean(process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY);
  const hasSelfHostedJudge0 = Boolean(judge0Url) && !/rapidapi/i.test(judge0Url);
  const localRunnerEnabled = readBooleanEnv(process.env.LOCAL_CODE_RUNNER_ENABLED, false);

  if (provider === 'local') return localRunnerEnabled;
  if (provider === 'judge0' || provider === 'self-hosted') return hasRapidApiKey || hasSelfHostedJudge0;
  return hasRapidApiKey || hasSelfHostedJudge0 || localRunnerEnabled;
}

function getAllowedOrigins() {
  return [
    ...new Set([
      ...DEFAULT_ALLOWED_ORIGINS,
      ...splitCsv(process.env.CORS_ORIGIN),
      ...splitCsv(process.env.CORS_ORIGINS),
      process.env.FRONTEND_URL
    ].filter(Boolean))
  ];
}

function getMissingEnv() {
  const missing = [];
  if (!process.env.MONGODB_URI && !process.env.DATABASE_URL && !process.env.MONGO_URI && !process.env.MONGO_URL && !process.env.MONGODB_URL) {
    missing.push('MONGODB_URI or DATABASE_URL');
  }

  const aiProvider = String(process.env.AI_PROVIDER || '').toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production';
  if ((isProduction || aiProvider === 'gemini') && !process.env.GEMINI_API_KEY) {
    missing.push('GEMINI_API_KEY');
  }
  if (isProduction && !process.env.GROQ_API_KEY) {
    missing.push('GROQ_API_KEY');
  }
  if (isProduction && !process.env.JWT_SECRET && !process.env.ADMIN_SECRET) {
    missing.push('JWT_SECRET or ADMIN_SECRET');
  }
  if (
    isProduction
    && !process.env.FIREBASE_SERVICE_ACCOUNT
    && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    && !process.env.FIREBASE_PROJECT_ID
    && !process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    missing.push('Firebase Admin credentials');
  }
  if (isProduction && !hasServerCodeRunner()) {
    missing.push('CODE_RUNNER_PROVIDER with LOCAL_CODE_RUNNER_ENABLED, JUDGE0_URL, or JUDGE0_API_KEY/RAPIDAPI_KEY');
  }

  return missing;
}

function validateEnv({ strict = false } = {}) {
  const missing = getMissingEnv();
  if (missing.length === 0) return { ok: true, missing };

  const message = `Missing environment variables: ${missing.join(', ')}`;
  if (strict) throw new Error(message);

  console.warn(`Environment warning: ${message}`);
  return { ok: false, missing };
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  getAllowedOrigins,
  getMissingEnv,
  hasServerCodeRunner,
  validateEnv
};
