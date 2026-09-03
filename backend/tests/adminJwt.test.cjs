const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = ['NODE_ENV', 'JWT_SECRET', 'ADMIN_SECRET'];
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

function loadAdminJwt(overrides = {}) {
  restoreEnv();
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  delete require.cache[require.resolve('../utils/adminJwt.cjs')];
  return require('../utils/adminJwt.cjs');
}

test.afterEach(() => {
  restoreEnv();
  delete require.cache[require.resolve('../utils/adminJwt.cjs')];
});

test('does not use a hardcoded admin JWT secret in production', () => {
  const { getAdminJwtSecret } = loadAdminJwt({
    NODE_ENV: 'production',
    JWT_SECRET: undefined,
    ADMIN_SECRET: undefined
  });

  assert.equal(getAdminJwtSecret(), null);
});

test('keeps a local-only admin JWT fallback for development', () => {
  const { getAdminJwtSecret, signAdminToken, verifyAdminToken } = loadAdminJwt({
    NODE_ENV: 'development',
    JWT_SECRET: undefined,
    ADMIN_SECRET: undefined
  });

  assert.equal(typeof getAdminJwtSecret(), 'string');

  const token = signAdminToken({ id: 'admin-1', role: 'admin' }, { expiresIn: '1h' });
  const decoded = verifyAdminToken(token);

  assert.equal(decoded.id, 'admin-1');
  assert.equal(decoded.role, 'admin');
});
