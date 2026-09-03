const InterviewSession = require('../models/InterviewSession.cjs');

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeQuestion(question, index = 0) {
  if (typeof question === 'string') {
    return { question, category: 'General' };
  }

  return {
    question: question?.question || question?.text || question?.title || `Question ${index + 1}`,
    category: question?.category || question?.topic || 'General',
    expectedPoints: asArray(question?.expectedPoints),
    followUp: question?.followUp || '',
    options: asArray(question?.options),
    correctAnswer: question?.correctAnswer
  };
}

function normalizeAnswer(answer, index = 0) {
  if (typeof answer === 'string') {
    return {
      questionIndex: index,
      answer,
      timestamp: new Date()
    };
  }

  return {
    questionIndex: toNumber(answer?.questionIndex, index),
    question: answer?.question || '',
    answer: answer?.answer ?? answer?.userAnswer ?? answer?.selectedAnswer ?? '',
    isCorrect: Boolean(answer?.isCorrect),
    category: answer?.category || 'General',
    timestamp: toDate(answer?.timestamp, new Date()),
    timeSpent: toNumber(answer?.timeSpent, 0),
    score: Number.isFinite(Number(answer?.score)) ? Number(answer.score) : undefined,
    feedback: answer?.feedback || '',
    code: answer?.code || '',
    language: answer?.language || ''
  };
}

function scoreToTen(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 10 ? Math.round(number) / 10 : number;
}

function normalizeAssessment(assessment = {}, fallbackScore = 0) {
  const overallScore = Number.isFinite(Number(assessment.overallScore))
    ? scoreToTen(assessment.overallScore)
    : scoreToTen(assessment.overallRating || assessment.percentage || fallbackScore);

  return {
    overallScore,
    overallRating: assessment.overallRating,
    percentage: assessment.percentage,
    summary: assessment.summary || '',
    categoryScores: assessment.categoryScores || assessment.breakdown || assessment.categoryBreakdown || {},
    strengths: asArray(assessment.strengths),
    improvements: asArray(assessment.improvements || assessment.areasForImprovement),
    areasForImprovement: asArray(assessment.areasForImprovement || assessment.improvements),
    recommendations: asArray(assessment.recommendations),
    detailedFeedback: assessment.detailedFeedback || assessment.detailedAnalysis || '',
    detailedAnalysis: assessment.detailedAnalysis || assessment.detailedFeedback || '',
    nextSteps: asArray(assessment.nextSteps || assessment.recommendations),
    interviewReadiness: assessment.interviewReadiness || ''
  };
}

async function saveInterviewSession(payload = {}) {
  const sessionId = payload.sessionId || `${payload.interviewType || 'session'}_${Date.now()}_${payload.userId || 'guest'}`;
  const totalQuestions = toNumber(payload.totalQuestions || payload.totalProblems, asArray(payload.questions).length);
  const answeredQuestions = toNumber(
    payload.answeredQuestions || payload.solvedProblems,
    asArray(payload.answers).length || totalQuestions
  );
  const correctAnswers = toNumber(payload.correctAnswers || payload.solvedProblems, 0);
  const timeSpent = toNumber(payload.timeSpent, toNumber(payload.duration, 0) * 60);
  const endTime = toDate(payload.endTime, new Date());
  const startTime = toDate(
    payload.startTime,
    new Date(endTime.getTime() - Math.max(timeSpent, 0) * 1000)
  );

  const session = {
    sessionId,
    userId: payload.userId || 'guest',
    topic: payload.topic || payload.role || 'General Interview',
    difficulty: payload.difficulty || 'medium',
    duration: toNumber(payload.duration, Math.ceil(timeSpent / 60)),
    interviewType: payload.interviewType || payload.type || 'face-to-face',
    startTime,
    endTime,
    timeSpent,
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    questions: asArray(payload.questions || payload.interviewQuestions || payload.problems).map(normalizeQuestion),
    answers: asArray(payload.answers || payload.userResponses || payload.solutions).map(normalizeAnswer),
    assessment: normalizeAssessment(payload.assessment || {}, totalQuestions ? (correctAnswers / totalQuestions) * 10 : 0),
    source: payload.source || 'backend',
    metadata: payload.metadata || {},
    updatedAt: new Date()
  };

  return InterviewSession.findOneAndUpdate(
    { sessionId },
    session,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function saveAiInterviewReport({ userId, role, difficulty, answers, duration, report, source, sessionId }) {
  const normalizedAnswers = asArray(answers);
  const overallScore = scoreToTen(report?.overallScore || report?.overallRating || 0);

  return saveInterviewSession({
    sessionId: sessionId || `ai_report_${Date.now()}_${userId || 'guest'}`,
    userId: userId || 'guest',
    topic: role || 'AI Interview',
    role,
    difficulty: difficulty || 'medium',
    duration: toNumber(duration, 0),
    timeSpent: toNumber(duration, 0) * 60,
    interviewType: 'ai-interview',
    totalQuestions: normalizedAnswers.length,
    answeredQuestions: normalizedAnswers.length,
    correctAnswers: normalizedAnswers.filter((item) => Number(item?.score || item?.evaluation?.score || 0) >= 6).length,
    questions: normalizedAnswers.map((item, index) => ({
      question: item.question || `Question ${index + 1}`,
      category: item.category || role || 'AI Interview',
      expectedPoints: item.expectedPoints || []
    })),
    answers: normalizedAnswers.map((item, index) => ({
      questionIndex: index,
      question: item.question || '',
      answer: item.answer || item.userAnswer || '',
      category: item.category || role || 'AI Interview',
      score: item.score || item.evaluation?.score,
      feedback: item.feedback || item.evaluation?.feedback || ''
    })),
    assessment: {
      overallScore,
      summary: report?.summary || '',
      categoryScores: report?.breakdown || report?.categoryBreakdown || {},
      strengths: report?.strengths || [],
      improvements: report?.improvements || report?.areasForImprovement || [],
      areasForImprovement: report?.areasForImprovement || report?.improvements || [],
      recommendations: report?.recommendations || [],
      detailedFeedback: report?.detailedAnalysis || report?.summary || '',
      nextSteps: report?.recommendations || [],
      interviewReadiness: overallScore ? `${Math.round(overallScore * 10)}% interview readiness` : ''
    },
    source: source || 'ai-provider',
    metadata: { role, generatedBy: 'aiInterviewController' }
  });
}

module.exports = {
  normalizeAnswer,
  normalizeAssessment,
  normalizeQuestion,
  saveAiInterviewReport,
  saveInterviewSession,
  scoreToTen
};
