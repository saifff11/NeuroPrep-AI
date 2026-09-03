const jwt = require('jsonwebtoken');

const DEV_ADMIN_JWT_SECRET = 'neuroprep-dev-admin-jwt-secret';

function getAdminJwtSecret() {
  const configuredSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return DEV_ADMIN_JWT_SECRET;
}

function signAdminToken(payload, options = {}) {
  const secret = getAdminJwtSecret();
  if (!secret) {
    throw new Error('Admin JWT secret is not configured');
  }

  return jwt.sign(payload, secret, options);
}

function verifyAdminToken(token) {
  const secret = getAdminJwtSecret();
  if (!token || !secret) return null;

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

module.exports = {
  getAdminJwtSecret,
  signAdminToken,
  verifyAdminToken
};
