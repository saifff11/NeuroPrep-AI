const express = require('express');
const judge0Service = require('../services/judge0Service.cjs');

const router = express.Router();

router.get('/health', (_req, res) => {
  const config = judge0Service.getConfig();
  res.json({
    success: true,
    judge0: {
      configured: config.configured,
      baseUrl: config.baseUrl,
      host: config.host
    }
  });
});

router.post('/run', async (req, res) => {
  try {
    const { code, languageId, stdin = '' } = req.body || {};
    if (!code || !languageId) {
      return res.status(400).json({ success: false, error: 'code and languageId are required' });
    }

    const result = await judge0Service.runOnce({ code, languageId, stdin });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Judge0 run error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run code',
      details: error.message
    });
  }
});

router.post('/run-batch', async (req, res) => {
  try {
    const { code, languageId, testCases = [] } = req.body || {};
    if (!code || !languageId) {
      return res.status(400).json({ success: false, error: 'code and languageId are required' });
    }
    if (!Array.isArray(testCases)) {
      return res.status(400).json({ success: false, error: 'testCases must be an array' });
    }

    const result = await judge0Service.runBatch({ code, languageId, testCases });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Judge0 batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run tests',
      details: error.message
    });
  }
});

module.exports = router;
