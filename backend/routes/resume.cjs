const express = require('express');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const {
  analyzeResumeText,
  getSupportedRoles
} = require('../services/resumeAnalyzerService.cjs');
const ResumeAnalysis = require('../models/ResumeAnalysis.cjs');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf';
    const isText = file.mimetype === 'text/plain' || file.originalname?.toLowerCase().endsWith('.txt');
    if (isPdf || isText) return cb(null, true);
    return cb(new Error('Only PDF and TXT resumes are supported.'));
  }
});

async function extractUploadedText(file) {
  if (!file) return '';

  if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const data = await parser.getText();
      return data.text || '';
    } finally {
      await parser.destroy();
    }
  }

  return file.buffer.toString('utf8');
}

router.get('/roles', (req, res) => {
  res.json({
    success: true,
    roles: getSupportedRoles()
  });
});

router.get('/history/:userId', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const history = await ResumeAnalysis.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      history,
      latest: history[0] || null
    });
  } catch (error) {
    console.error('Resume history failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load resume history'
    });
  }
});

async function handleAnalyze(req, res) {
  try {
    const uploadedText = await extractUploadedText(req.file);
    const resumeText = [uploadedText, req.body.resumeText].filter(Boolean).join('\n\n').trim();

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: 'Upload a PDF/TXT resume or paste resume text.'
      });
    }

    const analysis = analyzeResumeText({
      resumeText,
      targetRole: req.body.targetRole,
      jobDescription: req.body.jobDescription,
      targetSkills: req.body.targetSkills
    });
    const userId = req.body.userId || req.user?.uid || req.firebaseUser?.uid || 'guest';
    const saved = await ResumeAnalysis.create({
      ...analysis,
      userId,
      analyzedAt: new Date()
    });

    res.json({
      success: true,
      analysis: saved.toObject()
    });
  } catch (error) {
    console.error('Resume analysis failed:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to analyze resume'
    });
  }
}

router.post('/analyze', (req, res) => {
  upload.single('resume')(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        error: uploadError.message || 'Resume upload failed'
      });
    }

    return handleAnalyze(req, res);
  });
});

module.exports = router;
