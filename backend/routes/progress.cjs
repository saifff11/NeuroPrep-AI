const express = require('express');
const mongoose = require('mongoose');
const QAInteraction = require('../models/QAInteraction.cjs');
const ResumeAnalysis = require('../models/ResumeAnalysis.cjs');
const Submission = require('../models/Submission.cjs');
const StudentPerformance = require('../models/StudentPerformance.cjs');
const { buildPlacementReadiness, buildProgressSummary, getTimeframeStart } = require('../utils/progressSummary.cjs');

const router = express.Router();

function getInterviewSessionModel() {
  return mongoose.models.InterviewSession || null;
}

router.get('/user-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const since = getTimeframeStart(req.query.timeframe || 'all');
    const dateFilter = since ? { $gte: since } : null;
    const InterviewSession = getInterviewSessionModel();

    const [sessions, submissions, qaResponses, performance, latestResumeAnalysis] = await Promise.all([
      InterviewSession
        ? InterviewSession.find({
            userId,
            ...(dateFilter ? { createdAt: dateFilter } : {})
          }).sort({ createdAt: -1 }).lean()
        : [],
      Submission.find({
        userId,
        ...(dateFilter ? { submittedAt: dateFilter } : {})
      }).sort({ submittedAt: -1 }).lean().catch(() => []),
      QAInteraction.find({
        userId,
        ...(dateFilter ? { answeredAt: dateFilter } : {})
      }).sort({ answeredAt: -1 }).lean(),
      StudentPerformance.findOne({ userId }).lean().catch(() => null),
      ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }).lean().catch(() => null)
    ]);

    const filteredPerformance = performance && since
      ? {
          ...performance,
          interactions: (performance.interactions || []).filter((item) => new Date(item.timestamp) >= since)
        }
      : performance;

    const progress = buildProgressSummary({
      sessions,
      submissions,
      qaResponses,
      performance: filteredPerformance
    });

    res.json({
      success: true,
      progress: {
        ...progress,
        latestResumeAnalysis,
        placementReadiness: buildPlacementReadiness(progress, latestResumeAnalysis)
      },
      message: 'User progress retrieved from database'
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user progress',
      details: error.message
    });
  }
});

router.post('/store-mcq-session', async (req, res) => {
  try {
    const InterviewSession = getInterviewSessionModel();
    if (!InterviewSession) {
      return res.status(503).json({ success: false, error: 'Interview session model is not available' });
    }

    const payload = req.body || {};
    const sessionId = payload.sessionId || `mcq_${Date.now()}_${payload.userId || 'guest'}`;
    const totalQuestions = Number(payload.totalQuestions || 0);
    const correctAnswers = Number(payload.correctAnswers || 0);

    const doc = await InterviewSession.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        userId: payload.userId || 'guest',
        topic: payload.topic || 'General MCQ',
        difficulty: payload.difficulty || 'medium',
        duration: payload.duration || Math.ceil(Number(payload.timeSpent || 0) / 60) || 10,
        interviewType: 'mcq',
        startTime: payload.startTime || new Date(),
        endTime: payload.endTime || new Date(),
        timeSpent: Number(payload.timeSpent || 0),
        totalQuestions,
        answeredQuestions: Number(payload.answeredQuestions || totalQuestions),
        correctAnswers,
        questions: payload.questions || [],
        answers: payload.answers || [],
        assessment: payload.assessment || {
          overallScore: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) / 10 : 0
        },
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'MCQ session stored successfully',
      sessionId: doc.sessionId,
      data: doc
    });
  } catch (error) {
    console.error('Error storing MCQ session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store MCQ session',
      details: error.message
    });
  }
});

router.post('/store-coding-session', async (req, res) => {
  try {
    const InterviewSession = getInterviewSessionModel();
    if (!InterviewSession) {
      return res.status(503).json({ success: false, error: 'Interview session model is not available' });
    }

    const payload = req.body || {};
    const sessionId = payload.sessionId || `coding_${Date.now()}_${payload.userId || 'guest'}`;
    const totalQuestions = Number(payload.totalProblems || payload.totalQuestions || 1);
    const solvedProblems = Number(payload.solvedProblems || payload.correctAnswers || 0);

    const doc = await InterviewSession.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        userId: payload.userId || 'guest',
        topic: payload.topic || 'Coding Practice',
        difficulty: payload.difficulty || 'medium',
        duration: payload.duration || Math.ceil(Number(payload.timeSpent || 0) / 60) || 30,
        interviewType: 'coding',
        startTime: payload.startTime || new Date(),
        endTime: payload.endTime || new Date(),
        timeSpent: Number(payload.timeSpent || 0),
        totalQuestions,
        answeredQuestions: solvedProblems,
        correctAnswers: solvedProblems,
        questions: payload.problems || payload.questions || [],
        answers: payload.solutions || payload.answers || [],
        assessment: payload.assessment || {
          overallScore: totalQuestions ? Math.round((solvedProblems / totalQuestions) * 100) / 10 : 0
        },
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Coding session stored successfully',
      sessionId: doc.sessionId,
      data: doc
    });
  } catch (error) {
    console.error('Error storing coding session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store coding session',
      details: error.message
    });
  }
});

module.exports = router;
