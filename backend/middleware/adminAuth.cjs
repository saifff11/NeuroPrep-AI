const { getAdminJwtSecret, verifyAdminToken: verifyAdminJwtToken } = require('../utils/adminJwt.cjs');

// Middleware to verify admin JWT token
const verifyAdminMiddleware = (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.ace_admin_token || 
                  (req.headers.authorization?.startsWith('Bearer ') 
                    ? req.headers.authorization.substring(7) 
                    : null);

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Admin authentication required.' 
      });
    }

    if (!getAdminJwtSecret()) {
      return res.status(503).json({
        success: false,
        error: 'Admin authentication is not configured on the server',
        code: 'ADMIN_AUTH_NOT_CONFIGURED'
      });
    }

    const decoded = verifyAdminJwtToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token'
      });
    }

    // Attach admin info to request (normalize id to _id for consistency)
    const adminId = decoded.id || decoded._id;
    req.admin = {
      id: adminId,
      _id: adminId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Admin JWT verification error:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired admin token' 
    });
  }
};

module.exports = verifyAdminMiddleware;
