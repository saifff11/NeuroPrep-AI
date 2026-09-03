/**
 * Middleware to validate Firebase ID tokens.
 *
 * Behavior:
 * - Validates Firebase ID tokens from the Authorization header when Firebase Admin is configured.
 * - Fails closed in production if Firebase Admin is not configured.
 * - Allows an explicit local-only unverified-token fallback for development convenience.
 *
 * Admin authentication intentionally lives in adminAuth.cjs/adminController.cjs.
 */

let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  console.warn('Firebase Admin SDK is not installed; Firebase auth cannot verify tokens.');
}

let firebaseApp;
let isFirebaseInitialized = false;

function getFirebaseServiceAccount() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!rawServiceAccount && !base64ServiceAccount) return null;

  const raw = rawServiceAccount || Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(raw);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return serviceAccount;
}

function initializeFirebase() {
  if (isFirebaseInitialized || !admin) return;

  try {
    if (admin.apps && admin.apps.length > 0) {
      firebaseApp = admin.app();
      isFirebaseInitialized = true;
      return;
    }

    const serviceAccount = getFirebaseServiceAccount();

    if (serviceAccount) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFirebaseInitialized = true;
      console.log('Firebase Admin SDK initialized with service account credentials.');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      isFirebaseInitialized = true;
      console.log('Firebase Admin SDK initialized with project ID.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = admin.initializeApp();
      isFirebaseInitialized = true;
      console.log('Firebase Admin SDK initialized with Google application default credentials.');
    }
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error.message);
  }
}

function getBearerToken(authHeader) {
  if (!authHeader) return null;
  return authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;
}

function shouldFailClosed() {
  return process.env.NODE_ENV === 'production'
    || process.env.REQUIRE_FIREBASE_AUTH === 'true';
}

function decodeJwtPayloadWithoutVerification(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;

  const normalizedPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalizedPayload, 'base64').toString('utf8'));
}

initializeFirebase();

async function requireFirebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Missing Authorization header' });
    }

    initializeFirebase();

    if (!isFirebaseInitialized || !admin) {
      if (shouldFailClosed()) {
        return res.status(503).json({
          success: false,
          error: 'Firebase authentication is not configured on the server',
          code: 'FIREBASE_AUTH_NOT_CONFIGURED'
        });
      }

      console.warn('Firebase Admin SDK is not initialized; accepting unverified Firebase token in local development only.');

      const token = getBearerToken(authHeader);
      let uid = `dev_user_${Date.now()}`;
      try {
        const payload = decodeJwtPayloadWithoutVerification(token);
        uid = payload?.user_id || payload?.uid || payload?.sub || uid;
      } catch (decodeError) {
        console.warn('Could not decode token, using generated dev UID:', decodeError.message);
      }

      req.firebaseUser = { uid, role: 'user', note: 'dev-unverified-token' };
      req.user = req.firebaseUser;
      return next();
    }

    const token = getBearerToken(authHeader);

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      req.firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
        role: 'user',
        firebase: decodedToken
      };
      req.user = req.firebaseUser;

      return next();
    } catch (error) {
      console.warn('Firebase token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid Firebase token',
        details: error.message
      });
    }
  } catch (err) {
    console.error('Firebase auth middleware error:', err.message || err);
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed',
      details: err.message
    });
  }
}

module.exports = requireFirebaseAuth;
module.exports.verifyToken = requireFirebaseAuth;
module.exports.requireFirebaseAuth = requireFirebaseAuth;
module.exports._internal = {
  decodeJwtPayloadWithoutVerification,
  getBearerToken,
  initializeFirebase,
  shouldFailClosed
};
