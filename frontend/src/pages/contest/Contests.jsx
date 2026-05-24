import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Code2,
  History,
  Layers3,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Trophy,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';
import {
  checkRegistrationStatus,
  getPastContests,
  getUpcomingContests,
  registerForContest,
} from '../../services/ContestService';
import {
  checkInterviewParticipation,
  getAllCustomInterviews,
} from '../../services/CustomInterviewService';
import { useAuth } from '../../contexts/AuthContext';

const difficultyClasses = {
  easy: 'border-teal-200 bg-teal-50 text-teal-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  hard: 'border-rose-200 bg-rose-50 text-rose-700',
  expert: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  mixed: 'border-cyan-200 bg-cyan-50 text-cyan-700',
};

const getId = (item) => item?._id || item?.id;

const getProblemCount = (contest) => {
  if (Array.isArray(contest?.problems)) return contest.problems.length;
  return Number(contest?.problems || 0);
};

const getParticipantCount = (contest) => {
  if (Array.isArray(contest?.participants)) return contest.participants.length;
  return contest?.participants || contest?.participantCount || 0;
};

const formatDateTime = (dateString) => {
  if (!dateString) return { date: 'Not set', time: 'Not set' };
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return { date: 'Not set', time: 'Not set' };
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
};

const formatTime = (dateString) => {
  const formatted = formatDateTime(dateString);
  return `${formatted.date}, ${formatted.time}`;
};

const calculateEndTime = (contest) => {
  if (contest?.endTime) return contest.endTime;
  if (!contest?.startTime) return null;
  const start = new Date(contest.startTime);
  const duration = Number(contest.duration || 0);
  return new Date(start.getTime() + duration * 60000).toISOString();
};

const formatDuration = (duration) => {
  const minutes = Number(duration);
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Not set';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const getContestStatus = (contest) => {
  const now = Date.now();
  const start = contest?.startTime ? new Date(contest.startTime).getTime() : 0;
  const end = calculateEndTime(contest) ? new Date(calculateEndTime(contest)).getTime() : 0;
  if (contest?.status === 'completed' || contest?.status === 'ended') return 'completed';
  if (start && now < start) return 'upcoming';
  if (start && end && now >= start && now <= end) return 'ongoing';
  return 'completed';
};

const getDifficultyClass = (difficulty = 'mixed') => {
  const key = String(difficulty).toLowerCase();
  return difficultyClasses[key] || difficultyClasses.mixed;
};

const CountdownTimer = ({ contest }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const start = contest?.startTime ? new Date(contest.startTime).getTime() : now;
  const diff = start - now;

  if (diff <= 0) {
    return <span className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">Live now</span>;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { label: 'Days', value: days },
        { label: 'Hours', value: hours },
        { label: 'Mins', value: minutes },
      ].map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-lg font-bold text-slate-950">{String(item.value).padStart(2, '0')}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <Icon className="h-4 w-4 text-cyan-600" aria-hidden="true" />
    <p className="mt-3 text-xl font-bold text-slate-950">{value}</p>
    <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
  </div>
);

const EmptyState = ({ title, copy, icon: Icon }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-white">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
    <h3 className="text-lg font-bold text-slate-950">{title}</h3>
    <p className="mt-2 text-sm text-slate-600">{copy}</p>
  </div>
);

const Contests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedContest, setSelectedContest] = useState(null);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [pastContests, setPastContests] = useState([]);
  const [customInterviews, setCustomInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState({});
  const [interviewParticipations, setInterviewParticipations] = useState({});
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [contestToRegister, setContestToRegister] = useState(null);

  useEffect(() => {
    loadContests();
    const interval = setInterval(loadContests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      const [upcoming, past, interviews] = await Promise.all([
        getUpcomingContests(),
        getPastContests(),
        getAllCustomInterviews(),
      ]);

      setUpcomingContests(upcoming);
      setPastContests(past);
      setCustomInterviews(interviews);

      if (user?.uid) {
        const regStatus = {};
        for (const contest of upcoming) {
          const contestId = getId(contest);
          try {
            regStatus[contestId] = await checkRegistrationStatus(contestId, user.uid);
          } catch (err) {
            console.log('Failed to check registration:', contestId);
          }
        }
        setRegistrations(regStatus);

        const participationStatus = {};
        for (const interview of interviews) {
          try {
            participationStatus[interview.interviewId] = await checkInterviewParticipation(interview.interviewId, user.uid);
          } catch (err) {
            console.log('Failed to check participation:', interview.interviewId);
          }
        }
        setInterviewParticipations(participationStatus);
      }
    } catch (error) {
      console.error('Error loading contests:', error);
      toast.error('Could not load contest workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (contest) => {
    if (!user?.uid) {
      toast.error('Please login to register', { position: 'top-center' });
      navigate('/login');
      return;
    }
    setContestToRegister(contest);
    setShowRegisterModal(true);
  };

  const confirmRegistration = async () => {
    if (!contestToRegister) return;
    const contestId = getId(contestToRegister);

    try {
      await registerForContest(contestId, user.uid);
      toast.success('Successfully registered.', { position: 'top-center' });
      const status = await checkRegistrationStatus(contestId, user.uid);
      setRegistrations({ ...registrations, [contestId]: status });
      setShowRegisterModal(false);
      setContestToRegister(null);
    } catch (error) {
      toast.error('Registration failed. Please try again.', { position: 'top-center' });
    }
  };

  const startOrRegister = (contest) => {
    const contestId = getId(contest);
    const status = getContestStatus(contest);
    if (status === 'ongoing') {
      navigate(`/contest/${contestId}/problems`);
      return;
    }
    handleRegisterClick(contest);
  };

  const ContestCard = ({ contest, index, isPast = false }) => {
    const contestId = getId(contest);
    const status = getContestStatus(contest);
    const isRegistered = !!registrations[contestId];
    const prize = contest.prize || contest.prizes || 'Recognition and ranking';

    return (
      <motion.div
        key={contestId}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${getDifficultyClass(contest.difficulty)}`}>
            {contest.difficulty || 'Mixed'}
          </span>
          <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
            {status}
          </span>
          {isRegistered && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Registered
            </span>
          )}
        </div>

        <button type="button" onClick={() => setSelectedContest(contest)} className="block text-left">
          <h3 className="text-xl font-bold text-slate-950 transition group-hover:text-cyan-700">{contest.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{contest.description}</p>
        </button>

        {!isPast && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <CalendarClock className="h-4 w-4 text-cyan-600" aria-hidden="true" />
              Starts in
            </div>
            <CountdownTimer contest={contest} />
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Metric icon={Clock3} label="Duration" value={formatDuration(contest.duration)} />
          <Metric icon={Code2} label="Problems" value={getProblemCount(contest)} />
          <Metric icon={Users} label="Joined" value={getParticipantCount(contest)} />
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Reward</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{prize}</p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedContest(contest)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
          >
            Details
          </button>
          {!isPast && (
            <button
              type="button"
              onClick={() => startOrRegister(contest)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              {status === 'ongoing' ? 'Start now' : isRegistered ? 'Registered' : 'Register'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const InterviewCard = ({ interview, index }) => {
    const hasParticipated = interviewParticipations[interview.interviewId];
    const isExpired = interview.expiresAt && new Date(interview.expiresAt) < new Date();
    const isActive = interview.status !== 'expired' && interview.status !== 'completed' && !isExpired;

    return (
      <motion.div
        key={interview.interviewId}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={isActive ? { y: -4 } : {}}
        className={`rounded-lg border bg-white p-5 shadow-sm transition ${isActive ? 'border-slate-200 hover:border-cyan-300 hover:shadow-lg' : 'border-slate-200 opacity-70'}`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
            AI Interview
          </span>
          {hasParticipated && (
            <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">Completed</span>
          )}
          {interview.difficulty && (
            <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${getDifficultyClass(interview.difficulty)}`}>
              {interview.difficulty}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-950">{interview.title || interview.interviewName || 'AI interview'}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {interview.description || 'Face-to-face AI interview experience'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric icon={Layers3} label="Questions" value={interview.questions?.length || interview.numberOfQuestions || 0} />
          <Metric icon={Users} label="Participants" value={interview.participantsCount || 0} />
        </div>

        {interview.expiresAt && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{isExpired ? 'Expired' : 'Expires'}</span>
            {!isExpired && `: ${formatTime(interview.expiresAt)}`}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (!isActive) return;
            if (!user?.uid) {
              toast.error('Please login to start interview', { position: 'top-center' });
              navigate('/login');
              return;
            }
            navigate(`/interview/${interview.interviewId}`);
          }}
          disabled={!isActive}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {hasParticipated ? 'Retake interview' : 'Start interview'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="saas-grid min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:flex lg:items-end lg:justify-between lg:gap-8"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Contest and interview operations
            </div>
            <h1 className="max-w-3xl text-3xl font-bold text-slate-950 sm:text-4xl">
              Run competitive coding and AI interview pipelines.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Register for live contests, start AI-powered interview assignments, and review completed challenges from one SaaS workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={loadContests}
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700 lg:mt-0"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </motion.div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <Metric icon={CalendarClock} label="Active or upcoming contests" value={upcomingContests.length} />
          <Metric icon={UserRoundCheck} label="AI interviews" value={customInterviews.length} />
          <Metric icon={History} label="Completed contests" value={pastContests.length} />
        </div>

        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Active contest board</h2>
              <p className="mt-1 text-sm text-slate-600">Upcoming and ongoing competitive coding sessions.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div key={item} className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white p-5">
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                  <div className="mt-8 h-24 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : upcomingContests.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No active contests" copy="New contests will appear here when admins publish them." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingContests.map((contest, index) => (
                <ContestCard key={getId(contest)} contest={contest} index={index} />
              ))}
            </div>
          )}
        </section>

        {customInterviews.length > 0 && (
          <section className="mb-12">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">AI-powered interviews</h2>
              <p className="mt-1 text-sm text-slate-600">Scheduled or custom interview assignments ready for face-to-face practice.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customInterviews.map((interview, index) => (
                <InterviewCard key={interview.interviewId} interview={interview} index={index} />
              ))}
            </div>
          </section>
        )}

        {pastContests.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">Contest history</h2>
              <p className="mt-1 text-sm text-slate-600">Completed coding challenges and archived contest records.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastContests.map((contest, index) => (
                <ContestCard key={getId(contest)} contest={contest} index={index} isPast />
              ))}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {showRegisterModal && contestToRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    Confirm registration
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">{contestToRegister.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">You are about to register for this contest.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close registration modal"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <Metric icon={CalendarClock} label="Starts" value={formatDateTime(contestToRegister.startTime).time} />
                <Metric icon={Clock3} label="Duration" value={formatDuration(contestToRegister.duration)} />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRegistration}
                  className="flex-1 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={() => setSelectedContest(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
              className="my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${getDifficultyClass(selectedContest.difficulty)}`}>
                      {selectedContest.difficulty || 'Mixed'}
                    </span>
                    <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                      {getContestStatus(selectedContest)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950">{selectedContest.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedContest.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContest(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close contest details"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <Metric icon={CalendarClock} label="Start" value={formatDateTime(selectedContest.startTime).time} />
                <Metric icon={Clock3} label="End" value={formatDateTime(calculateEndTime(selectedContest)).time} />
                <Metric icon={Code2} label="Problems" value={getProblemCount(selectedContest)} />
                <Metric icon={Users} label="Participants" value={getParticipantCount(selectedContest)} />
              </div>

              {(selectedContest.tags || []).length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Topics covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContest.tags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {typeof tag === 'string' ? tag : tag.label || tag.name || tag.title || 'Topic'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedContest.problems) && selectedContest.problems.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Problem list</h3>
                  <div className="space-y-3">
                    {selectedContest.problems.map((problem, index) => (
                      <div key={problem._id || problem.id || index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-950">{problem.title || `Problem ${index + 1}`}</p>
                            {problem.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{problem.description}</p>}
                          </div>
                          {problem.difficulty && (
                            <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${getDifficultyClass(problem.difficulty)}`}>
                              {problem.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getContestStatus(selectedContest) !== 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    const contest = selectedContest;
                    setSelectedContest(null);
                    startOrRegister(contest);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  {getContestStatus(selectedContest) === 'ongoing' ? 'Start contest now' : 'Register for contest'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contests;
