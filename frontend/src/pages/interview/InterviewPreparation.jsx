import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Code2,
  Layers3,
  PlayCircle,
  Route,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { ROUND_MODES, getRoundsForTrack, isModeImplemented } from '../../config/roundsConfig';
import { getTrackByKey, tracksConfig } from '../../config/tracksConfig';
import ChooseYourPath from '../../components/interview/ChooseYourPath';

const categoryCopy = {
  tech: {
    eyebrow: 'Technical interview OS',
    title: 'Build a role-specific technical readiness plan.',
    copy: 'Pick a role, review the round map, then launch the AI interview sequence with coding, MCQ, and live conversation practice.',
  },
  nonTech: {
    eyebrow: 'Business interview OS',
    title: 'Prepare for strategy, product, design, and leadership rounds.',
    copy: 'Turn broad career goals into a structured interview sequence with clear signals and coaching checkpoints.',
  },
  company: {
    eyebrow: 'Company pipeline OS',
    title: 'Practice company-specific interview flows.',
    copy: 'Prepare for aptitude, coding, technical, managerial, and HR stages with one guided round map.',
  },
};

const modeIcon = (mode) => {
  if (mode === ROUND_MODES.CODING) return Code2;
  if (mode === ROUND_MODES.PERSON) return UserRoundCheck;
  if (mode === ROUND_MODES.MCQ) return BrainCircuit;
  return Route;
};

export default function InterviewPreparation() {
  const { category: urlCategory } = useParams();
  const [category, setCategory] = React.useState(
    urlCategory === 'tech' ? 'tech' :
      urlCategory === 'non-tech' ? 'nonTech' :
        urlCategory === 'company' ? 'company' : null
  );
  const [selectedRoleKey, setSelectedRoleKey] = React.useState(null);
  const [showStartConfirmation, setShowStartConfirmation] = React.useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (urlCategory === 'tech') setCategory('tech');
    else if (urlCategory === 'non-tech') setCategory('nonTech');
    else if (urlCategory === 'company') setCategory('company');
    else setCategory(null);
  }, [urlCategory]);

  const selectedTrack = selectedRoleKey ? getTrackByKey(selectedRoleKey) : null;
  const rounds = selectedRoleKey ? getRoundsForTrack(selectedRoleKey) : [];
  const implementedRounds = rounds.filter((round) => isModeImplemented(round.mode));
  const totalRounds = rounds.length;
  const readyRounds = implementedRounds.length;
  const currentCopy = categoryCopy[category] || categoryCopy.tech;

  const modeRoute = (mode) => {
    switch (mode) {
      case ROUND_MODES.CODING: return '/compiler';
      case ROUND_MODES.PERSON: return '/face-to-face-interview';
      case ROUND_MODES.MCQ: return '/mcq-interview';
      case ROUND_MODES.CASE:
      case ROUND_MODES.SCENARIO:
      case ROUND_MODES.PITCH:
      case ROUND_MODES.ANALYSIS:
      default:
        return '/face-to-face-interview';
    }
  };

  const startFullInterview = () => {
    if (implementedRounds.length > 0) {
      const firstRound = implementedRounds[0];
      navigate(modeRoute(firstRound.mode), {
        state: {
          trackKey: selectedRoleKey,
          trackTitle: selectedTrack?.title,
          trackGroup: firstRound.trackGroup,
          roundId: firstRound.id,
          roundLabel: firstRound.label,
          roundStage: firstRound.stage,
          roundNumber: firstRound.number,
          mode: firstRound.mode,
          topic: selectedTrack?.title,
          subject: firstRound.label,
          jobRole: selectedTrack?.title,
          difficulty: firstRound.difficultyProfile?.includes('hard') ? 'hard' : 'medium',
          isFullInterview: true,
          allRounds: implementedRounds,
          currentRoundIndex: 0,
          totalRounds: implementedRounds.length,
        },
      });
    }
  };

  const TrackCard = ({ track, delay = 0 }) => {
    const isUnsplash = track.img.includes('images.unsplash.com');
    const base = track.img.split('?')[0];
    const src400 = isUnsplash ? `${base}?auto=format&fit=crop&w=400&q=60` : track.img;
    const src800 = isUnsplash ? `${base}?auto=format&fit=crop&w=800&q=70` : track.img;
    const src1200 = isUnsplash ? `${base}?auto=format&fit=crop&w=1200&q=75` : track.img;

    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedRoleKey(track.key)}
        className="group np-card overflow-hidden text-left transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
      >
        <div className="relative h-44 overflow-hidden bg-slate-200">
          <img
            src={src800}
            srcSet={isUnsplash ? `${src400} 400w, ${src800} 800w, ${src1200} 1200w` : undefined}
            sizes="(min-width:1280px) 30vw, (min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            loading="lazy"
            decoding="async"
            alt={`${track.title} cover`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent" />
          <div className="absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-700">
            {track.category}
          </div>
        </div>
        <div className="flex min-h-[260px] flex-col p-5">
          <h3 className="text-xl font-bold text-slate-950">{track.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{track.desc}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {track.subTopics.slice(0, 4).map((topic) => (
              <span key={topic.name} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {topic.name}
              </span>
            ))}
          </div>
          <div className="mt-auto pt-6">
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-cyan-700">
              Build round map
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </motion.button>
    );
  };

  const RoundCard = ({ round }) => {
    const isImplemented = isModeImplemented(round.mode);
    const Icon = modeIcon(round.mode);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-lg border p-5 shadow-sm ${isImplemented ? 'np-card' : 'border-slate-200 bg-slate-100 opacity-70'}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${isImplemented ? 'bg-slate-950 text-white' : 'bg-slate-300 text-slate-600'}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h5 className="font-bold text-slate-950">{round.label || round.title}</h5>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Round {round.stage ?? round.number}</p>
            </div>
          </div>
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${isImplemented ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
            {isImplemented ? 'Ready' : 'Soon'}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{round.description || `${round.mode} readiness checkpoint`}</p>
      </motion.div>
    );
  };

  return (
    <div className="np-page saas-grid">
      <div className="np-container py-10">
        {!category && !selectedRoleKey && (
          <ChooseYourPath
            onSelectTrack={(trackType) => {
              const path = trackType === 'nonTech' ? 'non-tech' : trackType;
              navigate(`/preparation/${path}`);
            }}
          />
        )}

        {category && !selectedRoleKey && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="np-card-ink mb-8 p-6 lg:flex lg:items-end lg:justify-between lg:gap-8">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {currentCopy.eyebrow}
                </div>
                <h1 className="max-w-3xl text-3xl font-bold text-white sm:text-4xl">{currentCopy.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{currentCopy.copy}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/preparation')}
                className="np-button-secondary mt-5 lg:mt-0"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Change path
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tracksConfig[category].map((track, index) => (
                <TrackCard key={track.key} track={track} delay={index * 0.06} />
              ))}
            </div>
          </motion.div>
        )}

        {selectedRoleKey && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="np-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                    <Route className="h-4 w-4" aria-hidden="true" />
                    Structured interview map
                  </div>
                  <h1 className="text-3xl font-bold text-slate-950">{selectedTrack?.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Move through the rounds sequentially or inspect each readiness checkpoint before starting.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleKey(null)}
                    className="np-button-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Roles
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRoleKey(null); setCategory(null); }}
                    className="np-button-primary"
                  >
                    Change category
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="np-card p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Launch full interview</h2>
                    <p className="mt-1 text-sm text-slate-600">Start from the first available AI round.</p>
                  </div>
                  <BadgeCheck className="h-6 w-6 text-teal-600" aria-hidden="true" />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Layers3, label: 'Total rounds', value: totalRounds },
                    { icon: CheckCircle2, label: 'Ready now', value: readyRounds },
                    { icon: BarChart3, label: 'Signals tracked', value: 'Live' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <Icon className="h-4 w-4 text-cyan-600" aria-hidden="true" />
                        <p className="mt-3 text-2xl font-bold text-slate-950">{item.value}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{item.label}</p>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowStartConfirmation(true)}
                  disabled={readyRounds === 0}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Start full interview
                </button>
              </div>

              <div className="np-card-ink p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-white">Operational flow</h2>
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Every implemented round routes into an active product module: MCQ, coding compiler, or face-to-face AI interview.
                </p>
                <div className="mt-6 space-y-3">
                  {implementedRounds.slice(0, 3).map((round) => (
                    <div key={round.id} className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-sm">
                      <span className="font-semibold text-white">{round.label}</span>
                      <span className="text-cyan-200">{round.mode}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-bold text-slate-950">Round sequence</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rounds.map((round) => <RoundCard key={round.id} round={round} />)}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showStartConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
              onClick={() => setShowStartConfirmation(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
              >
                <div className="mb-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-cyan-600 text-white">
                    <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">Start the full interview?</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You will begin a complete {selectedTrack?.title} sequence with {readyRounds} active rounds.
                  </p>
                </div>

                <div className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {[
                    `Complete ${readyRounds} ready rounds sequentially`,
                    'Practice coding, MCQ, and face-to-face modules',
                    'Track progress and continue after breaks',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowStartConfirmation(false)}
                    className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartConfirmation(false);
                      startFullInterview();
                    }}
                    className="flex-1 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Begin
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
