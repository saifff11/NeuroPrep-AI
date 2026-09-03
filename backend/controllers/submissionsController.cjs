const Submission = require('../models/Submission.cjs'); // Use the enhanced model
const mongoose = require('mongoose');

const VALID_SUBMISSION_STATUSES = new Set([
  'pending',
  'processing',
  'accepted',
  'wrong_answer',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'runtime_error',
  'compilation_error'
]);

function normalizeObjectId(value) {
  if (!value) return null;
  const raw = String(value);
  return mongoose.Types.ObjectId.isValid(raw) ? raw : null;
}

function normalizeLanguage(payload = {}) {
  if (payload.language) return String(payload.language).toLowerCase();
  const byJudge0Id = {
    50: 'c',
    54: 'cpp',
    62: 'java',
    63: 'javascript',
    71: 'python'
  };
  return byJudge0Id[Number(payload.languageId)] || 'python';
}

function normalizeStatus(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('accepted')) return 'accepted';
  if (raw.includes('wrong') || raw.includes('partial') || raw.includes('failed')) return 'wrong_answer';
  if (raw.includes('time')) return 'time_limit_exceeded';
  if (raw.includes('memory')) return 'memory_limit_exceeded';
  if (raw.includes('runtime')) return 'runtime_error';
  if (raw.includes('compile') || raw.includes('compilation')) return 'compilation_error';
  if (VALID_SUBMISSION_STATUSES.has(raw)) return raw;
  return 'pending';
}

function toFiniteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;

  const match = String(value).match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTestResult(result = {}) {
  const expected = result.expected ?? result.output ?? result.expectedOutput ?? '';
  const actual = result.actual ?? result.stdout ?? result.actualOutput ?? '';
  return {
    testCaseId: result.testCaseId ? String(result.testCaseId) : undefined,
    passed: Boolean(result.passed),
    input: result.input !== undefined ? String(result.input) : '',
    expected: expected !== undefined ? String(expected) : '',
    actual: actual !== undefined ? String(actual) : '',
    expectedOutput: expected !== undefined ? String(expected) : '',
    actualOutput: actual !== undefined ? String(actual) : '',
    compileOutput: result.compile_output || result.compileOutput || '',
    stderr: result.stderr || '',
    status: result.status || result.classification || '',
    executionTime: toFiniteNumber(result.time ?? result.executionTime, 0),
    memory: toFiniteNumber(result.memory, 0),
    error: result.error || '',
    isHidden: Boolean(result.hidden || result.isHidden)
  };
}

function ensureDbConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB not connected (readyState=' + mongoose.connection.readyState + ')');
    if (res && typeof res.status === 'function') {
      return res.status(503).json({ success: false, error: 'Database not connected', details: `Mongoose readyState=${mongoose.connection.readyState}` });
    }
    return false;
  }
  return true;
}

async function createSubmission(req, res) {
  try {
    const ok = ensureDbConnected(res);
    if (ok !== true) return;
    const payload = req.body || {};

    // Basic validation
    if (!payload || (typeof payload !== 'object')) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const contestId = normalizeObjectId(payload.contestId ?? payload.contest_id);
    const problemId = normalizeObjectId(payload.problemId ?? payload.problem_id);
    const userId = req.user?.uid ?? req.firebaseUser?.uid ?? payload.userId ?? payload.user_id ?? null;
    const source = contestId ? 'contest' : (payload.source || 'practice');

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required for submissions' });
    }

    if (!payload.code) {
      return res.status(400).json({ success: false, error: 'code is required for submissions' });
    }

    // Check contest timing if this is a contest submission
    let isPracticeMode = false;
    let canScore = true;
    
    if (contestId) {
      const Contest = require('../models/Contest.cjs');
      const contest = await Contest.findById(contestId);
      
      if (contest) {
        const now = new Date();
        const startTime = new Date(contest.startTime);
        const endTime = new Date(contest.endTime);
        
        // Check if contest has ended
        if (now > endTime) {
          isPracticeMode = true;
          canScore = false; // Don't count for scoring after contest ends
        } else if (now < startTime) {
          return res.status(400).json({ 
            success: false, 
            error: 'Contest has not started yet',
            startTime: contest.startTime
          });
        }
      }
    } else {
      isPracticeMode = true;
    }

    // Calculate test case statistics if available
    const testResults = (payload.testResults || payload.result?.details || []).map(normalizeTestResult);
    const totalTestCases = testResults.length || 0;
    const passedTestCases = testResults.filter(t => t.passed).length || 0;
    
    // Calculate practice/dashboard points from all submitted tests.
    // Contest leaderboard updates still depend on countsForScore/canScore below.
    const marksObtained = totalTestCases > 0
      ? Math.round((passedTestCases / totalTestCases) * 100) 
      : 0;

    // Determine completion status
    let completionStatus = 'not_attempted';
    if (passedTestCases === totalTestCases && totalTestCases > 0) {
      completionStatus = 'fully_solved';
    } else if (passedTestCases > 0) {
      completionStatus = 'partially_solved';
    }

    // Determine status
    let status = normalizeStatus(payload.status || payload.verdict || payload.result?.status?.description);
    if (passedTestCases === totalTestCases && totalTestCases > 0) {
      status = 'accepted';
    } else if (passedTestCases > 0) {
      status = 'wrong_answer';
    } else if (totalTestCases > 0) {
      status = 'wrong_answer';
    }

    // Normalize fields for Mongo model
    const toInsert = {
      userId,
      contestId,
      problemId,
      problemKey: payload.problemKey ? String(payload.problemKey) : null,
      problemIndex: Number(payload.problemIndex ?? payload.problem_index ?? 0) || 0,
      problemTitle: payload.problemTitle || payload.title || 'Coding practice',
      topic: payload.topic || payload.subject || 'Coding Practice',
      difficulty: payload.difficulty || 'medium',
      source,
      code: payload.code ?? '',
      language: normalizeLanguage(payload),
      verdict: payload.verdict || status,
      status,
      testResults,
      totalTestCases,
      passedTestCases,
      marksObtained,
      pointsAwarded: marksObtained,
      maxMarks: 100,
      completionStatus,
      executionTime: toFiniteNumber(payload.time ?? payload.exec_time, 0),
      memory: toFiniteNumber(payload.memory, 0),
      score: marksObtained,
      judgedAt: new Date(),
      isPracticeMode, // Flag to indicate if this was practice after contest
      countsForScore: canScore // Flag to indicate if this counts toward contest score
    };

    // Check for existing better submission (only if this can score)
    if (canScore && toInsert.userId && toInsert.contestId && toInsert.problemId) {
      const existing = await Submission.findOne({
        userId: toInsert.userId,
        contestId: toInsert.contestId,
        problemId: toInsert.problemId,
        countsForScore: true // Only compare with scored submissions
      }).sort({ marksObtained: -1 }).lean();

      if (existing && existing.marksObtained >= marksObtained) {
        // Save this attempt but return the existing best
        await Submission.create(toInsert);
        return res.status(201).json({ 
          success: true, 
          submission: existing,
          message: 'Submission saved. Previous best score maintained.'
        });
      }
    }

    // Write to MongoDB
    const doc = await Submission.create(toInsert);

    // Update contest participant progress if this is a scored submission
    if (canScore && toInsert.userId && toInsert.contestId && toInsert.problemId) {
      await updateContestProgress(toInsert.userId, toInsert.contestId, toInsert.problemId, marksObtained, completionStatus);
    }

    return res.status(201).json({ 
      success: true, 
      submission: doc,
      message: completionStatus === 'fully_solved' 
        ? `Submission saved: ${marksObtained}/100 points earned.` 
        : `Submission saved: ${marksObtained}/100 points earned (${passedTestCases}/${totalTestCases} tests passed).`,
      pointsAwarded: marksObtained,
      passedTestCases,
      totalTestCases,
      completionStatus,
      isPracticeMode
    });
  } catch (err) {
    console.error('createSubmission error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Helper function to update contest participant progress
async function updateContestProgress(userId, contestId, problemId, score, status) {
  try {
    const Contest = require('../models/Contest.cjs');
    const contest = await Contest.findById(contestId);
    
    if (!contest) return;

    // Find the participant
    const participant = contest.participants.find(p => p.userId === userId);
    if (!participant) return;

    // Find or create submission entry for this problem
    const submissionIndex = participant.submissions.findIndex(
      s => s.problemId.toString() === problemId.toString()
    );

    const newSubmission = {
      problemId,
      submittedAt: new Date(),
      passed: status === 'fully_solved',
      score
    };

    if (submissionIndex >= 0) {
      // Update if new score is better
      if (score > (participant.submissions[submissionIndex].score || 0)) {
        participant.submissions[submissionIndex] = newSubmission;
      }
    } else {
      // Add new submission
      participant.submissions.push(newSubmission);
    }

    // Recalculate total score (sum of best scores for each problem)
    participant.score = participant.submissions.reduce((total, sub) => total + (sub.score || 0), 0);

    // Mark as modified and save
    contest.markModified('participants');
    await contest.save();

    console.log(`Updated progress for user ${userId} in contest ${contestId}: Score ${participant.score}`);
  } catch (error) {
    console.error('Error updating contest progress:', error);
    // Don't throw - this is a background update
  }
}

async function listSubmissions(req, res) {
  try {
    const ok = ensureDbConnected(res);
    if (ok !== true) return;
    const { contestId, userId, problemIndex, skip = 0, limit = 50 } = req.query;
    const q = {};
    if (contestId) q.contestId = contestId;
    if (userId) q.userId = userId;
    if (problemIndex !== undefined) q.problemIndex = Number(problemIndex) || 0;

    const rows = await Submission.find(q)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(parseInt(skip, 10) || 0)
      .limit(parseInt(limit, 10) || 50)
      .lean();
    res.json({ success: true, submissions: rows });
  } catch (err) {
    console.error('listSubmissions error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getSubmission(req, res) {
  try {
    const ok = ensureDbConnected(res);
    if (ok !== true) return;
    const id = req.params.id;
    const doc = await Submission.findById(id).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, submission: doc });
  } catch (err) {
    console.error('getSubmission error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get user submissions for a contest
async function getUserContestSubmissions(req, res) {
  try {
    const ok = ensureDbConnected(res);
    if (ok !== true) return;
    
    const { userId, contestId } = req.params;

    const submissions = await Submission.find({
      userId,
      contestId
    })
    .sort({ marksObtained: -1, submittedAt: -1 })
    .lean();

    // Get best submission per problem
    const bestSubmissions = {};
    submissions.forEach(sub => {
      const problemKey = sub.problemId?.toString() || sub.problemKey || sub.problemTitle || 'unknown';
      if (!bestSubmissions[problemKey] || 
          bestSubmissions[problemKey].marksObtained < sub.marksObtained) {
        bestSubmissions[problemKey] = sub;
      }
    });

    return res.json({
      success: true,
      submissions: Object.values(bestSubmissions)
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
}

// Get submission status for a specific problem
async function getProblemSubmissionStatus(req, res) {
  try {
    const ok = ensureDbConnected(res);
    if (ok !== true) return;
    
    const { userId, contestId, problemId } = req.params;

    const submission = await Submission.findOne({
      userId,
      contestId,
      problemId
    })
    .sort({ marksObtained: -1 })
    .lean();

    if (!submission) {
      return res.json({
        success: true,
        data: {
          status: 'not_attempted',
          marksObtained: 0,
          completionStatus: 'not_attempted',
          passedTestCases: 0,
          totalTestCases: 0
        }
      });
    }

    return res.json({
      success: true,
      data: {
        status: submission.status,
        marksObtained: submission.marksObtained,
        completionStatus: submission.completionStatus,
        passedTestCases: submission.passedTestCases,
        totalTestCases: submission.totalTestCases
      }
    });

  } catch (error) {
    console.error('Error fetching problem status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch problem status'
    });
  }
}

module.exports = { 
  createSubmission, 
  listSubmissions, 
  getSubmission,
  getUserContestSubmissions,
  getProblemSubmissionStatus
};
