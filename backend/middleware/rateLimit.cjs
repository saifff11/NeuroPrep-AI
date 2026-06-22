function createRateLimiter({
  windowMs = 60 * 1000,
  max = 120,
  keyPrefix = 'global'
} = {}) {
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const key = `${keyPrefix}:${ip}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait and try again.'
      });
    }

    return next();
  };
}

module.exports = createRateLimiter;
