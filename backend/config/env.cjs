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
  if (isProduction && !process.env.JUDGE0_API_KEY && !process.env.RAPIDAPI_KEY) {
    missing.push('JUDGE0_API_KEY or RAPIDAPI_KEY');
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
  validateEnv
};
