const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = [
  'NODE_ENV',
  'REQUIRE_FIREBASE_AUTH',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_SERVICE_ACCOUNT_BASE64',
  'FIREBASE_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'ADMIN_SECRET',
  'JWT_SECRET'
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

function clearFirebaseAuthModule() {
  delete require.cache[require.resolve('../middleware/firebaseAuth.cjs')];
}

function useEnv(overrides = {}) {
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

  clearFirebaseAuthModule();
  return require('../middleware/firebaseAuth.cjs');
}

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function runMiddleware(middleware, req) {
  const res = createResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

function makeFakeFirebaseToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

test.afterEach(() => {
  restoreEnv();
  clearFirebaseAuthModule();
});

test('fails closed in production when Firebase Admin is not configured', async () => {
  const middleware = useEnv({
    NODE_ENV: 'production',
    FIREBASE_SERVICE_ACCOUNT: undefined,
    FIREBASE_SERVICE_ACCOUNT_BASE64: undefined,
    FIREBASE_PROJECT_ID: undefined,
    GOOGLE_APPLICATION_CREDENTIALS: undefined
  });

  const token = makeFakeFirebaseToken({ uid: 'user-1' });
  const result = await runMiddleware(middleware, {
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.body.code, 'FIREBASE_AUTH_NOT_CONFIGURED');
});

test('keeps local development fallback for unconfigured Firebase Admin', async () => {
  const middleware = useEnv({
    NODE_ENV: 'development',
    FIREBASE_SERVICE_ACCOUNT: undefined,
    FIREBASE_SERVICE_ACCOUNT_BASE64: undefined,
    FIREBASE_PROJECT_ID: undefined,
    GOOGLE_APPLICATION_CREDENTIALS: undefined
  });

  const token = makeFakeFirebaseToken({ user_id: 'dev-user-1' });
  const result = await runMiddleware(middleware, {
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.req.firebaseUser.uid, 'dev-user-1');
  assert.equal(result.req.firebaseUser.role, 'user');
  assert.equal(result.req.firebaseUser.note, 'dev-unverified-token');
});

test('does not accept admin secret headers in Firebase user auth middleware', async () => {
  const middleware = useEnv({
    NODE_ENV: 'development',
    ADMIN_SECRET: 'local-admin-secret',
    FIREBASE_SERVICE_ACCOUNT: undefined,
    FIREBASE_SERVICE_ACCOUNT_BASE64: undefined,
    FIREBASE_PROJECT_ID: undefined,
    GOOGLE_APPLICATION_CREDENTIALS: undefined
  });

  const result = await runMiddleware(middleware, {
    headers: { 'x-admin-secret': 'local-admin-secret' }
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.body.error, 'Missing Authorization header');
});
