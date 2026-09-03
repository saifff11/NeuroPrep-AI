const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildProgressSummary,
  getSessionScore,
  getTimeframeStart,
  isAcceptedSubmission,
  normalizeSessionType
} = require('../utils/progressSummary.cjs');

test('normalizes interview session types from legacy and current fields', () => {
  assert.equal(normalizeSessionType({ interviewType: 'MCQ Practice' }), 'mcq');
  assert.equal(normalizeSessionType({ type: 'coding-session' }), 'coding');
  assert.equal(normalizeSessionType({ interviewType: 'face' }), 'face-to-face');
});

test('calculates session scores from assessment or answer counts', () => {
  assert.equal(getSessionScore({ assessment: { overallScore: 8.5 } }), 8.5);
  assert.equal(getSessionScore({ assessment: { overallRating: 4 } }), 8);
  assert.equal(getSessionScore({ totalQuestions: 5, correctAnswers: 3 }), 6);
});

test('detects accepted coding submissions from statuses and test cases', () => {
  assert.equal(isAcceptedSubmission({ status: 'accepted' }), true);
  assert.equal(isAcceptedSubmission({ completionStatus: 'fully_solved' }), true);
  assert.equal(isAcceptedSubmission({ totalTestCases: 4, passedTestCases: 4 }), true);
  assert.equal(isAcceptedSubmission({ totalTestCases: 4, passedTestCases: 3 }), false);
});

test('builds progress summary from real session, submission, and QA records', () => {
  const progress = buildProgressSummary({
    sessions: [
      {
        sessionId: 'mcq-1',
        interviewType: 'mcq',
        topic: 'DSA',
        difficulty: 'easy',
        totalQuestions: 10,
        correctAnswers: 8,
        createdAt: new Date('2026-06-01T10:00:00Z'),
        assessment: { overallScore: 8 }
      },
      {
        sessionId: 'face-1',
        interviewType: 'face-to-face',
        topic: 'System Design',
        difficulty: 'medium',
        createdAt: new Date('2026-06-02T10:00:00Z'),
        assessment: {
          overallScore: 7,
          strengths: ['Clear communication'],
          improvements: ['Add tradeoffs'],
          recommendations: ['Practice architecture diagrams']
        }
      }
    ],
    submissions: [
      {
        _id: 'sub-1',
        status: 'accepted',
        score: 90,
        submittedAt: new Date('2026-06-03T10:00:00Z')
      }
    ],
    qaResponses: [
      {
        _id: 'qa-1',
        topic: 'DSA',
        difficulty: 'easy',
        isCorrect: true,
        answeredAt: new Date('2026-06-04T10:00:00Z')
      }
    ]
  });

  assert.equal(progress.totalMCQAttempts, 2);
  assert.equal(progress.totalCodingAttempts, 1);
  assert.equal(progress.totalFaceToFaceInterviews, 1);
  assert.equal(progress.mcqAccuracy, 82);
  assert.equal(progress.codingSuccess, 90);
  assert.equal(progress.overallRating, 8);
  assert.equal(progress.strengths[0], 'Clear communication');
  assert.equal(progress.recentActivity.length, 4);
});

test('uses submitted coding points for dashboard coding score', () => {
  const progress = buildProgressSummary({
    submissions: [
      {
        _id: 'sub-1',
        topic: 'Arrays',
        difficulty: 'medium',
        pointsAwarded: 100,
        totalTestCases: 4,
        passedTestCases: 4,
        submittedAt: new Date('2026-06-03T10:00:00Z')
      },
      {
        _id: 'sub-2',
        topic: 'Arrays',
        difficulty: 'medium',
        pointsAwarded: 50,
        totalTestCases: 4,
        passedTestCases: 2,
        submittedAt: new Date('2026-06-04T10:00:00Z')
      }
    ]
  });

  assert.equal(progress.totalCodingAttempts, 2);
  assert.equal(progress.codingSuccess, 75);
  assert.equal(progress.typeScores.coding, 75);
  assert.equal(progress.topicProgress[0].codingScore, 75);
});

test('returns null timeframe for unsupported values and dates for supported ranges', () => {
  assert.equal(getTimeframeStart('all'), null);
  assert.equal(getTimeframeStart('unknown'), null);
  assert.ok(getTimeframeStart('7d') instanceof Date);
});

test('includes resume analyses in recent activity history', () => {
  const progress = buildProgressSummary({
    resumeAnalyses: [
      {
        analysisId: 'resume-1',
        targetRole: 'Backend Developer',
        placementReadinessScore: 82,
        createdAt: new Date('2026-06-05T10:00:00Z')
      }
    ]
  });

  assert.equal(progress.recentActivity.length, 1);
  assert.equal(progress.recentActivity[0].type, 'resume');
  assert.equal(progress.recentActivity[0].topic, 'Backend Developer');
  assert.equal(progress.recentActivity[0].score, 8.2);
});
