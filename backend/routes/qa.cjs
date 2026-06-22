const express = require('express');
const QAInteraction = require('../models/QAInteraction.cjs');

const router = express.Router();

function toPublicHistory(row) {
  return {
    sessionId: row.sessionId,
    questionData: {
      topic: row.topic,
      difficulty: row.difficulty,
      question: row.question,
      options: row.options,
      correctAnswer: row.correctAnswer,
      explanation: row.explanation
    },
    userAnswer: row.userAnswer,
    isCorrect: row.isCorrect,
    timestamp: row.answeredAt
  };
}

router.post('/store-qa', async (req, res) => {
  try {
    const { sessionId, userId, questionData = {}, userAnswer, isCorrect } = req.body || {};

    if (!sessionId || !userId || !questionData.question) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, userId, and questionData.question are required'
      });
    }

    await QAInteraction.create({
      sessionId,
      userId,
      topic: questionData.topic || 'General',
      difficulty: questionData.difficulty || 'medium',
      question: questionData.question,
      options: Array.isArray(questionData.options) ? questionData.options : [],
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation || '',
      userAnswer,
      isCorrect: Boolean(isCorrect),
      answeredAt: new Date()
    });

    const [totalQuestions, totalSessions] = await Promise.all([
      QAInteraction.countDocuments({ userId }),
      QAInteraction.distinct('sessionId', { userId }).then((ids) => ids.length)
    ]);

    res.json({
      success: true,
      message: 'Q&A stored successfully',
      analytics: {
        totalQuestions,
        totalSessions
      }
    });
  } catch (error) {
    console.error('Error storing Q&A:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store Q&A data',
      details: error.message
    });
  }
});

router.get('/qa-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const history = await QAInteraction.find({ userId })
      .sort({ answeredAt: -1 })
      .limit(limit)
      .lean();
    const totalQuestions = await QAInteraction.countDocuments({ userId });
    const correct = await QAInteraction.countDocuments({ userId, isCorrect: true });

    res.json({
      success: true,
      history: history.map(toPublicHistory),
      totalQuestions,
      accuracy: totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching Q&A history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Q&A history',
      details: error.message
    });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const rows = await QAInteraction.find({ sessionId }).sort({ answeredAt: 1 }).lean();

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const correctAnswers = rows.filter((row) => row.isCorrect).length;
    const start = rows[0].answeredAt;
    const end = rows[rows.length - 1].answeredAt;

    res.json({
      success: true,
      session: {
        sessionId,
        userId: rows[0].userId,
        startTime: start,
        topic: rows[0].topic,
        difficulty: rows[0].difficulty,
        questions: rows.map((row) => ({
          question: row.question,
          options: row.options,
          correctAnswer: row.correctAnswer,
          userAnswer: row.userAnswer,
          isCorrect: row.isCorrect,
          explanation: row.explanation,
          answeredAt: row.answeredAt
        }))
      },
      analytics: {
        totalQuestions: rows.length,
        correctAnswers,
        accuracy: rows.length ? Math.round((correctAnswers / rows.length) * 100) : 0,
        topic: rows[0].topic,
        difficulty: rows[0].difficulty,
        duration: Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000))
      }
    });
  } catch (error) {
    console.error('Error fetching Q&A session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session data',
      details: error.message
    });
  }
});

router.get('/qa-analytics', async (_req, res) => {
  try {
    const [totalQuestions, sessions, topicDistribution, difficultyDistribution, questionStats] = await Promise.all([
      QAInteraction.countDocuments({}),
      QAInteraction.distinct('sessionId', {}),
      QAInteraction.aggregate([{ $group: { _id: '$topic', count: { $sum: 1 } } }]),
      QAInteraction.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
      QAInteraction.aggregate([
        {
          $group: {
            _id: '$question',
            total: { $sum: 1 },
            correct: { $sum: { $cond: ['$isCorrect', 1, 0] } }
          }
        }
      ])
    ]);

    const averageCorrectRate = questionStats.length
      ? questionStats.reduce((sum, item) => sum + (item.correct / item.total), 0) / questionStats.length * 100
      : 0;

    res.json({
      success: true,
      analytics: {
        totalQuestions,
        totalSessions: sessions.length,
        topicDistribution: Object.fromEntries(topicDistribution.map((item) => [item._id || 'General', item.count])),
        difficultyDistribution: Object.fromEntries(difficultyDistribution.map((item) => [item._id || 'medium', item.count])),
        questionBank: {
          totalUniqueQuestions: questionStats.length,
          averageCorrectRate: Math.round(averageCorrectRate)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Q&A analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      details: error.message
    });
  }
});

module.exports = router;
