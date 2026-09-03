import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  Code2,
  FileText,
  Flame,
  LineChart as LineChartIcon,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const emptyDashboard = {
  totalMCQAttempts: 0,
  totalCodingAttempts: 0,
  totalFaceToFaceInterviews: 0,
  mcqAccuracy: 0,
  codingSuccess: 0,
  overallScore: 0,
  totalMinutes: 0,
  answeredQuestions: 0,
  streakDays: 0,
  recentActivity: [],
  topicProgress: [],
  monthlyProgress: [],
  difficultyProgress: [],
  strengths: [],
  improvements: [],
  recommendations: [],
  bestTopic: null,
  focusTopic: null,
  practiceMix: [],
  typeScores: { mcq: 0, coding: 0, interview: 0 },
  latestResumeAnalysis: null,
  placementReadiness: {
    overallScore: 0,
    scores: { coding: 0, mcq: 0, interview: 0, resume: 0 },
    suggestedFocus: [],
    status: 'Needs consistent practice',
    latestResume: null
  }
};

const typeMeta = {
  mcq: { label: 'MCQ', icon: Brain, color: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700' },
  coding: { label: 'Coding', icon: Code2, color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'face-to-face': { label: 'Face-to-Face', icon: MessageSquareText, color: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-700' },
  resume: { label: 'Resume', icon: FileText, color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' }
};

const formatDate = (value) => {
  if (!value) return 'Today';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeType = (session) => {
  const raw = String(session?.interviewType || session?.type || '').toLowerCase();
  if (raw.includes('mcq')) return 'mcq';
  if (raw.includes('coding') || raw.includes('code')) return 'coding';
  return 'face-to-face';
};

const scoreFromSession = (session) => {
  const assessment = session?.assessment || {};
  if (Number.isFinite(assessment.overallScore)) return Number(assessment.overallScore);
  if (Number.isFinite(assessment.overallRating)) return Number(assessment.overallRating) * 2;
  if (Number.isFinite(assessment.percentage)) return Number(assessment.percentage) / 10;
  return 0;
};

const correctFromSession = (session) => {
  if (Number.isFinite(session?.correctAnswers)) return Number(session.correctAnswers);
  const answers = Array.isArray(session?.answers) ? session.answers : [];
  const answerCorrect = answers.filter((answer) => answer?.isCorrect).length;
  if (answerCorrect > 0) return answerCorrect;
  const total = Number(session?.totalQuestions || 0);
  return Math.round((scoreFromSession(session) / 10) * total);
};

const normalizeSession = (session) => {
  const type = normalizeType(session);
  const totalQuestions = Number(session?.totalQuestions || session?.questions?.length || 0);
  const correctAnswers = correctFromSession(session);

  return {
    id: session?.sessionId || session?._id || `${type}-${session?.createdAt || Date.now()}`,
    type,
    topic: session?.topic || 'General Interview',
    difficulty: session?.difficulty || 'medium',
    totalQuestions,
    correctAnswers,
    answeredQuestions: Number(session?.answeredQuestions || session?.answers?.length || totalQuestions || 0),
    timeSpent: Number(session?.timeSpent || 0),
    timestamp: session?.createdAt || session?.endTime || session?.startTime || new Date().toISOString(),
    assessment: session?.assessment || {},
    score: scoreFromSession(session)
  };
};

const applyTimeframe = (sessions, timeframe) => {
  if (timeframe === 'all') return sessions;
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sessions.filter((session) => new Date(session.timestamp).getTime() >= cutoff);
};

const generateMonthlyProgress = (sessions) => {
  const monthlyData = {};
  const last6Months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toISOString().slice(0, 7);
    monthlyData[key] = { mcq: 0, coding: 0, faceToFace: 0, score: 0, scored: 0 };
    last6Months.push(key);
  }

  sessions.forEach((session) => {
    const date = new Date(session.timestamp);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 7);
    if (!monthlyData[key]) return;

    if (session.type === 'mcq') monthlyData[key].mcq += 1;
    if (session.type === 'coding') monthlyData[key].coding += 1;
    if (session.type === 'face-to-face') monthlyData[key].faceToFace += 1;
    if (session.score > 0) {
      monthlyData[key].score += session.score;
      monthlyData[key].scored += 1;
    }
  });

  return last6Months.map((month) => ({
    month: new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short' }),
    MCQ: monthlyData[month].mcq,
    Coding: monthlyData[month].coding,
    FaceToFace: monthlyData[month].faceToFace,
    Score: monthlyData[month].scored ? Math.round((monthlyData[month].score / monthlyData[month].scored) * 10) / 10 : 0
  }));
};

const calculateStreak = (sessions) => {
  const days = new Set(
    sessions
      .map((session) => new Date(session.timestamp))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const processProgressData = (rawSessions, timeframe) => {
  const normalized = applyTimeframe(rawSessions.map(normalizeSession), timeframe);
  if (normalized.length === 0) return { ...emptyDashboard, monthlyProgress: generateMonthlyProgress([]) };

  const mcqSessions = normalized.filter((session) => session.type === 'mcq');
  const codingSessions = normalized.filter((session) => session.type === 'coding');
  const faceSessions = normalized.filter((session) => session.type === 'face-to-face');
  const totalMCQQuestions = mcqSessions.reduce((sum, session) => sum + session.totalQuestions, 0);
  const correctMCQAnswers = mcqSessions.reduce((sum, session) => sum + session.correctAnswers, 0);
  const scoredSessions = normalized.filter((session) => session.score > 0);

  const topicStats = normalized.reduce((stats, session) => {
    const key = session.topic;
    stats[key] ||= { topic: key, attempts: 0, score: 0, questions: 0, correct: 0 };
    stats[key].attempts += 1;
    stats[key].score += session.score || (session.totalQuestions ? (session.correctAnswers / session.totalQuestions) * 10 : 0);
    stats[key].questions += session.totalQuestions;
    stats[key].correct += session.correctAnswers;
    return stats;
  }, {});

  const topicProgress = Object.values(topicStats)
    .map((topic) => ({
      topic: topic.topic,
      attempts: topic.attempts,
      successRate: Math.round(topic.attempts ? (topic.score / topic.attempts) * 10 : 0),
      accuracy: topic.questions ? Math.round((topic.correct / topic.questions) * 100) : 0
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 8);

  const sortedByScore = [...topicProgress].filter((topic) => topic.attempts > 0).sort((a, b) => b.successRate - a.successRate);
  const allStrengths = normalized.flatMap((session) => session.assessment?.strengths || []);
  const allImprovements = normalized.flatMap((session) => session.assessment?.improvements || session.assessment?.areasForImprovement || []);
  const allRecommendations = normalized.flatMap((session) => session.assessment?.recommendations || session.assessment?.nextSteps || []);

  return {
    totalMCQAttempts: mcqSessions.length,
    totalCodingAttempts: codingSessions.length,
    totalFaceToFaceInterviews: faceSessions.length,
    mcqAccuracy: totalMCQQuestions ? Math.round((correctMCQAnswers / totalMCQQuestions) * 100) : 0,
    codingSuccess: codingSessions.length ? Math.round((codingSessions.filter((session) => session.score >= 6).length / codingSessions.length) * 100) : 0,
    overallScore: scoredSessions.length ? Math.round((scoredSessions.reduce((sum, session) => sum + session.score, 0) / scoredSessions.length) * 10) / 10 : 0,
    totalMinutes: Math.round(normalized.reduce((sum, session) => sum + session.timeSpent, 0) / 60),
    answeredQuestions: normalized.reduce((sum, session) => sum + session.answeredQuestions, 0),
    streakDays: calculateStreak(normalized),
    recentActivity: normalized.slice(0, 6),
    topicProgress,
    monthlyProgress: generateMonthlyProgress(normalized),
    difficultyProgress: ['easy', 'medium', 'hard'].map((level) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count: normalized.filter((session) => session.difficulty?.toLowerCase() === level).length
    })),
    strengths: [...new Set(allStrengths)].slice(0, 4),
    improvements: [...new Set(allImprovements)].slice(0, 4),
    recommendations: [...new Set(allRecommendations)].slice(0, 4),
    bestTopic: sortedByScore[0] || null,
    focusTopic: sortedByScore[sortedByScore.length - 1] || null,
    practiceMix: [
      { name: 'MCQ', value: mcqSessions.length, color: typeMeta.mcq.color },
      { name: 'Coding', value: codingSessions.length, color: typeMeta.coding.color },
      { name: 'Face-to-Face', value: faceSessions.length, color: typeMeta['face-to-face'].color }
    ].filter((item) => item.value > 0),
    typeScores: { mcq: 0, coding: 0, interview: 0 },
    latestResumeAnalysis: null,
    placementReadiness: emptyDashboard.placementReadiness
  };
};

const mergeBackendProgress = (localDashboard, backendProgress = {}) => {
  const topicProgress = backendProgress.topicProgress?.length
    ? backendProgress.topicProgress
    : localDashboard.topicProgress;
  const sortedByScore = [...topicProgress].filter((topic) => topic.attempts > 0).sort((a, b) => b.successRate - a.successRate);

  return {
    ...localDashboard,
    totalMCQAttempts: backendProgress.totalMCQAttempts ?? localDashboard.totalMCQAttempts,
    totalCodingAttempts: backendProgress.totalCodingAttempts ?? localDashboard.totalCodingAttempts,
    totalFaceToFaceInterviews: backendProgress.totalFaceToFaceInterviews ?? localDashboard.totalFaceToFaceInterviews,
    mcqAccuracy: backendProgress.mcqAccuracy ?? localDashboard.mcqAccuracy,
    codingSuccess: backendProgress.codingSuccess ?? localDashboard.codingSuccess,
    overallScore: backendProgress.overallRating ?? localDashboard.overallScore,
    topicProgress,
    recentActivity: backendProgress.recentActivity?.length ? backendProgress.recentActivity : localDashboard.recentActivity,
    monthlyProgress: backendProgress.monthlyProgress?.length ? backendProgress.monthlyProgress : localDashboard.monthlyProgress,
    strengths: backendProgress.strengths?.length ? backendProgress.strengths : localDashboard.strengths,
    improvements: backendProgress.improvements?.length ? backendProgress.improvements : localDashboard.improvements,
    recommendations: backendProgress.recommendations?.length ? backendProgress.recommendations : localDashboard.recommendations,
    bestTopic: sortedByScore[0] || localDashboard.bestTopic,
    focusTopic: sortedByScore[sortedByScore.length - 1] || localDashboard.focusTopic,
    typeScores: backendProgress.typeScores || localDashboard.typeScores,
    latestResumeAnalysis: backendProgress.latestResumeAnalysis || null,
    placementReadiness: backendProgress.placementReadiness || localDashboard.placementReadiness
  };
};

const StatCard = ({ icon: Icon, label, value, detail, accent }) => (
  <div className="np-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="mt-3 text-sm text-slate-500">{detail}</p>
  </div>
);

const ReadinessBar = ({ label, value, color }) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-sm font-bold text-slate-950">{value}%</p>
    </div>
    <div className="np-progress-track">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  </div>
);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({ ...emptyDashboard, monthlyProgress: generateMonthlyProgress([]) });
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [scheduledInterviews, setScheduledInterviews] = useState({ upcoming: [], ongoing: [] });
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchDashboardData();
      fetchScheduledInterviews();
    }
  }, [user?.uid, selectedTimeframe, authLoading]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;

    setDataLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/interview/history/${user.uid}?limit=100`);
      const data = response.ok ? await response.json() : { sessions: [] };
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      const localDashboard = processProgressData(sessions, selectedTimeframe);

      try {
        const progressResponse = await fetch(`${API_BASE}/api/user-progress/${user.uid}?timeframe=${selectedTimeframe}`);
        const progressData = progressResponse.ok ? await progressResponse.json() : null;
        setDashboardData(progressData?.success ? mergeBackendProgress(localDashboard, progressData.progress) : localDashboard);
      } catch (progressError) {
        console.warn('Backend progress summary unavailable:', progressError.message);
        setDashboardData(localDashboard);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({ ...emptyDashboard, monthlyProgress: generateMonthlyProgress([]) });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchScheduledInterviews = async () => {
    if (!user?.uid) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/public/users/${user.uid}/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;
      const data = await response.json();
      const interviews = (data.registrations || []).map((registration) => registration.scheduledInterviewId).filter(Boolean);
      const now = new Date();

      setScheduledInterviews({
        upcoming: interviews.filter((interview) => determineInterviewStatus(interview, now) === 'upcoming'),
        ongoing: interviews.filter((interview) => determineInterviewStatus(interview, now) === 'ongoing')
      });
    } catch (error) {
      console.error('Error fetching scheduled interviews:', error);
    }
  };

  const determineInterviewStatus = (interview, now) => {
    let startDateTime;
    let endDateTime;

    if (interview.availableFromDate && interview.availableFromTime) {
      const fromDate = new Date(interview.availableFromDate);
      const [hours, minutes] = interview.availableFromTime.split(':');
      fromDate.setHours(Number(hours), Number(minutes), 0, 0);
      startDateTime = fromDate;

      const toDate = new Date(interview.availableToDate || interview.availableFromDate);
      const [endHours, endMinutes] = (interview.availableToTime || interview.availableFromTime).split(':');
      toDate.setHours(Number(endHours), Number(endMinutes), 0, 0);
      endDateTime = toDate;
    } else if (interview.scheduledDate) {
      const date = new Date(interview.scheduledDate);
      const [startHours, startMinutes] = interview.startTime.split(':');
      date.setHours(Number(startHours), Number(startMinutes), 0, 0);
      startDateTime = date;

      const endDate = new Date(interview.scheduledDate);
      const [endHours, endMinutes] = interview.endTime.split(':');
      endDate.setHours(Number(endHours), Number(endMinutes), 0, 0);
      endDateTime = endDate;
    } else {
      return 'upcoming';
    }

    if (now >= startDateTime && now <= endDateTime) return 'ongoing';
    if (now < startDateTime) return 'upcoming';
    return 'completed';
  };

  const handleStartInterview = (interview) => {
    navigate('/face-to-face-interview', {
      state: {
        scheduledInterview: {
          interviewId: interview.interviewId,
          scheduledInterviewId: interview._id,
          interviewName: interview.interviewName,
          interviewType: interview.interviewType,
          topics: interview.topics,
          companyName: interview.companyName,
          difficulty: interview.difficulty,
          numberOfQuestions: interview.numberOfQuestions,
          duration: interview.duration,
          isScheduled: true
        }
      }
    });
  };

  const nextMove = useMemo(() => {
    if (dashboardData.focusTopic) return `Practice ${dashboardData.focusTopic.topic} next`;
    if (dashboardData.totalMCQAttempts === 0) return 'Start with an MCQ warmup';
    if (dashboardData.totalFaceToFaceInterviews === 0) return 'Try a face-to-face interview';
    return 'Keep your streak alive today';
  }, [dashboardData]);

  const hasProgress = dashboardData.totalMCQAttempts + dashboardData.totalCodingAttempts + dashboardData.totalFaceToFaceInterviews > 0;

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-lg font-medium text-slate-700">{authLoading ? 'Authenticating...' : 'Loading your dashboard...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-lg font-medium text-slate-700">Please log in to view your dashboard.</p>
          <button onClick={() => navigate('/login')} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="np-page">
      <div className="np-container">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="np-card-ink p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
                  <Sparkles className="h-4 w-4" />
                  Placement command center
                </p>
                <h1 className="max-w-3xl text-3xl font-bold tracking-normal text-white sm:text-4xl">
                  Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Track readiness, resume strength, weak areas, and AI-guided next steps from one focused workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {['7d', '30d', '90d', 'all'].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      selectedTimeframe === timeframe
                        ? 'bg-white text-slate-950'
                        : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {timeframe === 'all' ? 'All time' : timeframe.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Next best action</p>
                <p className="mt-2 text-xl font-bold text-white">{nextMove}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Current streak</p>
                <p className="mt-2 text-3xl font-bold text-white">{dashboardData.streakDays}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Practice minutes</p>
                <p className="mt-2 text-3xl font-bold text-white">{dashboardData.totalMinutes}</p>
              </div>
            </div>
          </section>

          <aside className="np-card p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Placement readiness</p>
                <p className="mt-2 text-5xl font-bold text-slate-950">{dashboardData.placementReadiness.overallScore}%</p>
              </div>
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="mb-5 text-sm font-medium text-slate-600">{dashboardData.placementReadiness.status}</p>
            <div className="space-y-3">
              <ReadinessBar label="Coding" value={dashboardData.placementReadiness.scores.coding} color="bg-emerald-600" />
              <ReadinessBar label="MCQ" value={dashboardData.placementReadiness.scores.mcq} color="bg-blue-600" />
              <ReadinessBar label="Interview" value={dashboardData.placementReadiness.scores.interview} color="bg-violet-600" />
              <ReadinessBar label="Resume" value={dashboardData.placementReadiness.scores.resume} color="bg-amber-500" />
            </div>
            <button
              type="button"
              onClick={() => navigate(dashboardData.placementReadiness.scores.resume ? '/mock-interviews' : '/resume-analyzer')}
              className="np-button-primary mt-5 w-full"
            >
              {dashboardData.placementReadiness.scores.resume ? 'Practice weak area' : 'Analyze resume'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>

        {!hasProgress && (
          <div className="np-card mb-6 border-cyan-200 bg-cyan-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-cyan-950">Your first readiness signal is waiting.</h2>
                <p className="mt-1 text-sm text-cyan-800">Complete an MCQ, coding round, or face-to-face interview to activate progress tracking.</p>
              </div>
              <button onClick={() => navigate('/mock-interviews')} className="np-button-primary">
                Start practice
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {(scheduledInterviews.ongoing.length > 0 || scheduledInterviews.upcoming.length > 0) && (
          <div className="np-card mb-6 p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold">Scheduled Interviews</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {scheduledInterviews.ongoing.map((interview) => (
                <div key={interview._id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">Live now</p>
                  <h3 className="mt-1 font-bold text-slate-950">{interview.interviewName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{interview.companyName || interview.topics?.join(', ') || interview.difficulty}</p>
                  <button onClick={() => handleStartInterview(interview)} className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    Start now
                  </button>
                </div>
              ))}
              {scheduledInterviews.upcoming.slice(0, 2).map((interview) => (
                <div key={interview._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-blue-700">Upcoming</p>
                  <h3 className="mt-1 font-bold text-slate-950">{interview.interviewName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{interview.companyName || interview.topics?.join(', ') || interview.difficulty}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="mb-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Career Tools</h2>
              <p className="mt-1 text-sm text-slate-600">Resume, ATS, and skill-gap signals connected to your readiness score.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/resume-analyzer')}
              className="np-button-primary"
            >
              Analyze Resume
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate('/resume-analyzer')}
              className="np-card border-blue-200 bg-blue-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              <FileText className="mb-3 h-6 w-6 text-blue-700" />
              <h3 className="font-bold text-blue-950">Resume Analyzer</h3>
              <p className="mt-1 text-sm text-blue-800">ATS score checker</p>
              <p className="mt-1 text-sm text-blue-800">Job match analysis</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/resume-analyzer')}
              className="np-card border-emerald-200 bg-emerald-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              <ShieldCheck className="mb-3 h-6 w-6 text-emerald-700" />
              <h3 className="font-bold text-emerald-950">ATS Checker</h3>
              <p className="mt-1 text-sm text-emerald-800">Keyword and section fit</p>
              <p className="mt-1 text-sm text-emerald-800">Score improvement plan</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/resume-analyzer')}
              className="np-card border-violet-200 bg-violet-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-violet-100"
            >
              <Target className="mb-3 h-6 w-6 text-violet-700" />
              <h3 className="font-bold text-violet-950">Job Match Score</h3>
              <p className="mt-1 text-sm text-violet-800">Matched skills</p>
              <p className="mt-1 text-sm text-violet-800">Missing skill gaps</p>
            </button>
            <div className="np-card p-4 text-left">
              <MessageSquareText className="mb-3 h-6 w-6 text-slate-400" />
              <h3 className="font-bold text-slate-700">Cover Letter</h3>
              <p className="mt-1 text-sm text-slate-500">Generator</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">Future</p>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Brain} label="MCQ Attempts" value={dashboardData.totalMCQAttempts} detail={`${dashboardData.mcqAccuracy}% accuracy across MCQs`} accent="bg-blue-50 text-blue-700" />
          <StatCard icon={Code2} label="Coding Practice" value={dashboardData.totalCodingAttempts} detail={`${dashboardData.codingSuccess}/100 average coding points`} accent="bg-emerald-50 text-emerald-700" />
          <StatCard icon={MessageSquareText} label="Face-to-Face" value={dashboardData.totalFaceToFaceInterviews} detail="Completed interview simulations" accent="bg-violet-50 text-violet-700" />
          <StatCard icon={Trophy} label="AI Score" value={`${dashboardData.overallScore}/10`} detail={`${dashboardData.answeredQuestions} answers evaluated`} accent="bg-amber-50 text-amber-700" />
        </div>

        <div className="np-card mb-6 p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-600" />
                <h2 className="text-xl font-bold text-slate-950">AI Coach Focus</h2>
              </div>
              <p className="text-sm text-slate-600">The next recommendations are based on your latest practice, interview, and resume signals.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="np-button-secondary"
            >
              Open practice
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="np-card-quiet p-4">
              <p className="text-sm font-semibold text-slate-500">Suggested focus</p>
              <p className="mt-2 font-bold text-slate-950">
                {dashboardData.placementReadiness.suggestedFocus.length ? dashboardData.placementReadiness.suggestedFocus.join(', ') : 'Build your first scored signals'}
              </p>
            </div>
            <div className="np-card-quiet p-4">
              <p className="text-sm font-semibold text-slate-500">Best topic</p>
              <p className="mt-2 font-bold text-slate-950">{dashboardData.bestTopic?.topic || 'Not enough data yet'}</p>
            </div>
            <div className="np-card-quiet p-4">
              <p className="text-sm font-semibold text-slate-500">Weak area</p>
              <p className="mt-2 font-bold text-slate-950">{dashboardData.focusTopic?.topic || 'Awaiting signals'}</p>
            </div>
            <div className="np-card-quiet p-4">
              <p className="text-sm font-semibold text-slate-500">Resume status</p>
              <p className="mt-2 font-bold text-slate-950">
                {dashboardData.placementReadiness.scores.resume ? `${dashboardData.placementReadiness.scores.resume}% resume signal` : 'Resume not analyzed'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="np-card-ink p-5 lg:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Recommended next move</p>
                <h2 className="mt-2 text-2xl font-bold">{nextMove}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {dashboardData.bestTopic ? `Best topic: ${dashboardData.bestTopic.topic} at ${dashboardData.bestTopic.successRate}%.` : 'Build your first performance baseline.'}
                </p>
              </div>
              <button onClick={() => navigate('/mock-interviews')} className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 font-semibold text-slate-950 hover:bg-slate-100">
                Practice now
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/10 p-4">
                <Flame className="mb-2 h-5 w-5 text-orange-300" />
                <p className="text-2xl font-bold">{dashboardData.streakDays}</p>
                <p className="text-sm text-slate-300">day streak</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/10 p-4">
                <Zap className="mb-2 h-5 w-5 text-yellow-300" />
                <p className="text-2xl font-bold">{dashboardData.totalMinutes}</p>
                <p className="text-sm text-slate-300">minutes practiced</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/10 p-4">
                <Target className="mb-2 h-5 w-5 text-cyan-300" />
                <p className="text-2xl font-bold">{dashboardData.focusTopic?.successRate || 0}%</p>
                <p className="text-sm text-slate-300">focus topic score</p>
              </div>
            </div>
          </div>

          <div className="np-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-600" />
              <h2 className="font-bold">Practice Mix</h2>
            </div>
            {dashboardData.practiceMix.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={dashboardData.practiceMix} innerRadius={50} outerRadius={75} dataKey="value" nameKey="name" paddingAngle={3}>
                    {dashboardData.practiceMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[190px] items-center justify-center rounded-md bg-slate-50 text-sm text-slate-500">No practice mix yet</div>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-5">
          <div className="np-card p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold">Monthly Momentum</h2>
              </div>
              {lastUpdated && <p className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.monthlyProgress}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="Score" stroke="#2563eb" fill="url(#scoreFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="MCQ" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2} />
                <Area type="monotone" dataKey="FaceToFace" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="np-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold">Topic Performance</h2>
            </div>
            {dashboardData.topicProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.topicProgress} layout="vertical" margin={{ left: 12, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                  <YAxis type="category" dataKey="topic" width={110} stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="successRate" name="Score %" fill="#059669" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-md bg-slate-50 text-sm text-slate-500">Topic scores will appear after practice</div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="np-card p-5">
            <h2 className="mb-4 font-bold">Recent Activity</h2>
            <div className="space-y-3">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity) => {
                  const meta = typeMeta[activity.type] || typeMeta.mcq;
                  const Icon = meta.icon;
                  return (
                    <div key={activity.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${meta.bg} ${meta.text}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{activity.topic}</p>
                          <p className="text-sm capitalize text-slate-500">{meta.label} - {activity.difficulty} - {formatDate(activity.timestamp)}</p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-slate-800">{activity.score ? `${activity.score}/10` : `${activity.correctAnswers}/${activity.totalQuestions}`}</p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">No recent activity yet</div>
              )}
            </div>
          </div>

          <div className="np-card p-5">
            <h2 className="mb-4 font-bold">AI Analysis</h2>
            <div className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </h3>
              <div className="space-y-2">
                {(dashboardData.strengths.length ? dashboardData.strengths : ['Complete interviews for AI strengths']).map((item) => (
                  <p key={item} className="rounded-md bg-emerald-50 p-3 text-sm text-slate-700">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-700">
                <Target className="h-4 w-4" />
                Focus Areas
              </h3>
              <div className="space-y-2">
                {(dashboardData.improvements.length ? dashboardData.improvements : ['Complete interviews for improvement signals']).map((item) => (
                  <p key={item} className="rounded-md bg-rose-50 p-3 text-sm text-slate-700">{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="np-card p-5">
            <h2 className="mb-4 font-bold">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/mock-interviews')} className="flex w-full items-center justify-between rounded-md border border-blue-200 bg-blue-50 p-3 text-left font-semibold text-blue-800 hover:bg-blue-100">
                Start MCQ Practice
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/compiler')} className="flex w-full items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 p-3 text-left font-semibold text-emerald-800 hover:bg-emerald-100">
                Practice Coding
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/face-to-face-interview')} className="flex w-full items-center justify-between rounded-md border border-violet-200 bg-violet-50 p-3 text-left font-semibold text-violet-800 hover:bg-violet-100">
                Face-to-Face Interview
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/resume-analyzer')} className="flex w-full items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-left font-semibold text-amber-800 hover:bg-amber-100">
                Resume Analyzer
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-700">AI Recommendations</h3>
              <div className="space-y-2">
                {(dashboardData.recommendations.length ? dashboardData.recommendations : ['Finish one session to unlock personalized next steps.']).map((item) => (
                  <p key={item} className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
