function getTimeframeStart(timeframe) {
  if (!timeframe || timeframe === 'all') return null;
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : null;
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function normalizeSessionType(session) {
  const raw = String(session?.interviewType || session?.type || '').toLowerCase();
  if (raw.includes('mcq')) return 'mcq';
  if (raw.includes('coding') || raw.includes('code')) return 'coding';
  return 'face-to-face';
}

function getSessionScore(session) {
  const assessment = session?.assessment || {};
  if (Number.isFinite(Number(assessment.overallScore))) return Number(assessment.overallScore);
  if (Number.isFinite(Number(assessment.overallRating))) return Number(assessment.overallRating) * 2;
  if (Number.isFinite(Number(assessment.percentage))) return Number(assessment.percentage) / 10;
  if (Number(session?.totalQuestions) > 0) {
    return (Number(session.correctAnswers || 0) / Number(session.totalQuestions)) * 10;
  }
  return 0;
}

function isAcceptedSubmission(submission) {
  const status = String(submission?.status || submission?.completionStatus || '').toLowerCase();
  if (['accepted', 'fully_solved'].includes(status)) return true;
  const total = Number(submission?.totalTestCases || 0);
  return total > 0 && Number(submission?.passedTestCases || 0) === total;
}

function clampScore(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function average(values) {
  const clean = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function monthLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function buildPlacementReadiness(progress = {}, latestResumeAnalysis = null) {
  const scores = {
    coding: clampScore(progress.typeScores?.coding || progress.codingSuccess || 0),
    mcq: clampScore(progress.typeScores?.mcq || progress.mcqAccuracy || 0),
    interview: clampScore(progress.typeScores?.interview || 0),
    resume: clampScore(
      latestResumeAnalysis?.placementReadinessScore ||
      latestResumeAnalysis?.atsScore ||
      latestResumeAnalysis?.jobMatchScore ||
      0
    )
  };

  const weighted = [
    { key: 'coding', label: 'Coding', weight: 0.3, score: scores.coding },
    { key: 'mcq', label: 'MCQ', weight: 0.25, score: scores.mcq },
    { key: 'interview', label: 'Interview', weight: 0.25, score: scores.interview },
    { key: 'resume', label: 'Resume', weight: 0.2, score: scores.resume }
  ];

  const available = weighted.filter((item) => item.score > 0);
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0) || 1;
  const overallScore = available.length
    ? Math.round(available.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight)
    : 0;

  const sorted = weighted
    .filter((item) => item.score > 0)
    .sort((a, b) => a.score - b.score);
  const suggestedFocus = sorted.slice(0, 2).map((item) => item.label);

  return {
    overallScore,
    scores,
    suggestedFocus,
    status:
      overallScore >= 85 ? 'Placement ready' :
        overallScore >= 70 ? 'Strong, keep sharpening' :
          overallScore >= 55 ? 'Developing readiness' :
            'Needs consistent practice',
    latestResume: latestResumeAnalysis ? {
      analysisId: latestResumeAnalysis.analysisId,
      targetRole: latestResumeAnalysis.targetRole,
      atsScore: latestResumeAnalysis.atsScore,
      jobMatchScore: latestResumeAnalysis.jobMatchScore,
      placementReadinessScore: latestResumeAnalysis.placementReadinessScore,
      analyzedAt: latestResumeAnalysis.createdAt || latestResumeAnalysis.analyzedAt
    } : null
  };
}

function buildProgressSummary({ sessions = [], submissions = [], qaResponses = [], performance = null } = {}) {
  const mcqSessions = sessions.filter((session) => normalizeSessionType(session) === 'mcq');
  const codingSessions = sessions.filter((session) => normalizeSessionType(session) === 'coding');
  const faceSessions = sessions.filter((session) => normalizeSessionType(session) === 'face-to-face');

  const mcqQuestionTotal =
    mcqSessions.reduce((sum, session) => sum + Number(session.totalQuestions || 0), 0) +
    qaResponses.length;
  const mcqCorrectTotal =
    mcqSessions.reduce((sum, session) => sum + Number(session.correctAnswers || 0), 0) +
    qaResponses.filter((item) => item.isCorrect).length;

  const acceptedSubmissions = submissions.filter(isAcceptedSubmission);
  const allScores = [
    ...sessions.map(getSessionScore).filter((score) => score > 0),
    ...submissions
      .map((submission) => Number(submission.score || submission.marksObtained || 0) / 10)
      .filter((score) => score > 0)
  ];

  const modeScores = {
    mcq: [],
    coding: [],
    'face-to-face': []
  };

  const topicStats = new Map();
  const addTopic = (topicName, score, questions = 0, correct = 0, type = 'face-to-face') => {
    const topic = topicName || 'General';
    const current = topicStats.get(topic) || {
      topic,
      attempts: 0,
      scoreSum: 0,
      questions: 0,
      correct: 0,
      modes: {
        mcq: { attempts: 0, scoreSum: 0 },
        coding: { attempts: 0, scoreSum: 0 },
        'face-to-face': { attempts: 0, scoreSum: 0 }
      }
    };
    const normalizedType = modeScores[type] ? type : 'face-to-face';
    current.attempts += 1;
    current.scoreSum += Number(score || 0);
    current.questions += Number(questions || 0);
    current.correct += Number(correct || 0);
    current.modes[normalizedType].attempts += 1;
    current.modes[normalizedType].scoreSum += Number(score || 0);
    if (Number(score || 0) > 0) modeScores[normalizedType].push(Number(score || 0));
    topicStats.set(topic, current);
  };

  sessions.forEach((session) => {
    const type = normalizeSessionType(session);
    addTopic(
      session.topic,
      getSessionScore(session) * 10,
      session.totalQuestions,
      session.correctAnswers,
      type
    );
  });
  submissions.forEach((submission) => {
    const score = Number(submission.score || submission.marksObtained || 0);
    addTopic(submission.topic || submission.problemTitle || 'Contest Coding', score, 1, isAcceptedSubmission(submission) ? 1 : 0, 'coding');
  });
  qaResponses.forEach((item) => addTopic(item.topic, item.isCorrect ? 100 : 0, 1, item.isCorrect ? 1 : 0, 'mcq'));
  if (performance?.interactions?.length) {
    performance.interactions.forEach((item) => {
      addTopic(item.topicName, item.correct ? 100 : 0, 1, item.correct ? 1 : 0, 'mcq');
    });
  }

  const topicProgress = Array.from(topicStats.values())
    .map((topic) => ({
      topic: topic.topic,
      attempts: topic.attempts,
      successRate: topic.attempts ? Math.round(topic.scoreSum / topic.attempts) : 0,
      accuracy: topic.questions ? Math.round((topic.correct / topic.questions) * 100) : 0,
      mcqScore: topic.modes.mcq.attempts ? Math.round(topic.modes.mcq.scoreSum / topic.modes.mcq.attempts) : 0,
      codingScore: topic.modes.coding.attempts ? Math.round(topic.modes.coding.scoreSum / topic.modes.coding.attempts) : 0,
      interviewScore: topic.modes['face-to-face'].attempts ? Math.round(topic.modes['face-to-face'].scoreSum / topic.modes['face-to-face'].attempts) : 0,
      progress: topic.attempts ? Math.round(topic.scoreSum / topic.attempts) : 0
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 10);

  const recentActivity = [
    ...sessions.map((session) => ({
      id: session.sessionId || session._id,
      type: normalizeSessionType(session),
      topic: session.topic,
      difficulty: session.difficulty,
      score: Math.round(getSessionScore(session) * 10) / 10,
      timestamp: session.createdAt || session.endTime || session.startTime
    })),
    ...submissions.map((submission) => ({
      id: submission._id,
      type: 'coding',
      topic: 'Contest Coding',
      difficulty: 'contest',
      score: Number(submission.score || submission.marksObtained || 0) / 10,
      timestamp: submission.submittedAt || submission.createdAt
    })),
    ...qaResponses.map((item) => ({
      id: item._id,
      type: 'mcq',
      topic: item.topic,
      difficulty: item.difficulty,
      score: item.isCorrect ? 10 : 0,
      timestamp: item.answeredAt
    }))
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  const monthBuckets = new Map();
  recentActivity.forEach((item) => {
    const label = monthLabel(item.timestamp);
    const bucket = monthBuckets.get(label) || { month: label, MCQ: 0, Coding: 0, FaceToFace: 0, Score: 0, scored: 0 };
    if (item.type === 'mcq') bucket.MCQ += 1;
    if (item.type === 'coding') bucket.Coding += 1;
    if (item.type === 'face-to-face') bucket.FaceToFace += 1;
    if (Number(item.score) > 0) {
      bucket.Score += Number(item.score);
      bucket.scored += 1;
    }
    monthBuckets.set(label, bucket);
  });

  const strengths = [...new Set(sessions.flatMap((session) => session.assessment?.strengths || []))].slice(0, 5);
  const improvements = [...new Set(sessions.flatMap((session) => session.assessment?.improvements || session.assessment?.areasForImprovement || []))].slice(0, 5);
  const recommendations = [...new Set(sessions.flatMap((session) => session.assessment?.recommendations || session.assessment?.nextSteps || []))].slice(0, 5);

  const typeScores = {
    mcq: mcqQuestionTotal ? Math.round((mcqCorrectTotal / mcqQuestionTotal) * 100) : average(modeScores.mcq),
    coding: submissions.length
      ? Math.round((acceptedSubmissions.length / submissions.length) * 100)
      : average(modeScores.coding),
    interview: average(modeScores['face-to-face'])
  };

  return {
    totalMCQAttempts: mcqSessions.length + (qaResponses.length ? 1 : 0),
    totalCodingAttempts: codingSessions.length + submissions.length,
    totalFaceToFaceInterviews: faceSessions.length,
    mcqAccuracy: mcqQuestionTotal ? Math.round((mcqCorrectTotal / mcqQuestionTotal) * 100) : 0,
    codingSuccess: submissions.length
      ? Math.round((acceptedSubmissions.length / submissions.length) * 100)
      : codingSessions.length
        ? Math.round((codingSessions.filter((session) => getSessionScore(session) >= 6).length / codingSessions.length) * 100)
        : 0,
    recentActivity,
    topicProgress,
    typeScores,
    difficultyProgress: ['easy', 'medium', 'hard'].map((level) => ({
      level,
      count: sessions.filter((session) => String(session.difficulty || '').toLowerCase() === level).length
    })),
    monthlyProgress: Array.from(monthBuckets.values()).map((bucket) => ({
      month: bucket.month,
      MCQ: bucket.MCQ,
      Coding: bucket.Coding,
      FaceToFace: bucket.FaceToFace,
      Score: bucket.scored ? Math.round((bucket.Score / bucket.scored) * 10) / 10 : 0
    })),
    overallRating: allScores.length ? Math.round((allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 10) / 10 : 0,
    strengths,
    improvements,
    recommendations
  };
}

module.exports = {
  buildPlacementReadiness,
  buildProgressSummary,
  getTimeframeStart,
  getSessionScore,
  isAcceptedSubmission,
  normalizeSessionType
};
