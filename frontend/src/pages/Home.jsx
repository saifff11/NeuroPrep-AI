import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileText,
  Gauge,
  MessageSquareText,
  PlayCircle,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Video,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import interviewImage from '../assets/image.png';

const outcomes = [
  { label: 'Placement score', value: '74%', detail: 'Combined resume, coding, MCQ, and interview signal' },
  { label: 'Skill gaps found', value: '4', detail: 'Spring Boot, REST APIs, Docker, AWS' },
  { label: 'Next target', value: '85%+', detail: 'Personalized roadmap to job-ready level' },
];

const journey = [
  {
    icon: FileText,
    title: 'Analyze your resume',
    copy: 'Upload your resume, choose a target role, and see ATS score, job match, matched skills, and missing skills.',
  },
  {
    icon: Target,
    title: 'Find exact skill gaps',
    copy: 'NeuroPrep compares your current profile with job expectations and turns weak areas into a focused prep plan.',
  },
  {
    icon: Code2,
    title: 'Practice with purpose',
    copy: 'Start MCQ, compiler, and role-based rounds from the same weak areas instead of guessing what to study next.',
  },
  {
    icon: Video,
    title: 'Face AI interviews',
    copy: 'Run face-to-face interview simulations and get stronger recommendations after every session.',
  },
];

const features = [
  {
    icon: Gauge,
    title: 'Placement Readiness Score',
    copy: 'A single score combining resume, MCQ, coding, and interview performance so you always know where you stand.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Coach Recommendations',
    copy: 'After every practice session, NeuroPrep suggests the next topic, difficulty, and round type to improve faster.',
  },
  {
    icon: Route,
    title: 'Role-Based Roadmaps',
    copy: 'Prepare for software engineering, data, cybersecurity, product, design, and company-specific hiring flows.',
  },
  {
    icon: ClipboardCheck,
    title: 'MCQ + Compiler Practice',
    copy: 'Train technical fundamentals and coding logic in one connected practice system.',
  },
  {
    icon: MessageSquareText,
    title: 'Face-to-Face Interviews',
    copy: 'Practice communication, confidence, and technical explanation with AI interview rounds.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    copy: 'Track topic progress, weak areas, recent sessions, readiness history, and resume analysis over time.',
  },
];

const proofPoints = [
  'Resume to skill-gap interview workflow',
  'Dashboard-level placement readiness score',
  'Per-topic MCQ, coding, and interview progress',
  'Company, technical, and business track preparation',
];

const readinessRows = [
  { label: 'Resume match', value: 68, color: 'bg-amber-500' },
  { label: 'Coding practice', value: 82, color: 'bg-emerald-600' },
  { label: 'MCQ accuracy', value: 76, color: 'bg-blue-600' },
  { label: 'Interview confidence', value: 61, color: 'bg-violet-600' },
];

const MotionLink = motion(Link);

const LandingPreview = () => (
  <motion.div
    className="np-card overflow-hidden"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.65, delay: 0.15 }}
  >
    <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
      <img
        src={interviewImage}
        alt="Candidate practicing an AI interview with NeuroPrep AI"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 rounded-md border border-white/15 bg-slate-950/80 p-4 text-white backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold text-white">AI coach next move</p>
          </div>
          <span className="rounded-md bg-emerald-400 px-2 py-1 text-xs font-bold text-slate-950">Live</span>
        </div>
        <p className="text-sm leading-6 text-slate-200">
          Focus on REST API design, then start a Spring Boot skill-gap interview.
        </p>
      </div>
    </div>

    <div className="grid gap-4 p-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Placement readiness</p>
            <p className="mt-1 text-4xl font-bold text-slate-950">74%</p>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="space-y-3">
          {readinessRows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{row.label}</span>
                <span className="font-bold text-slate-950">{row.value}%</span>
              </div>
              <div className="np-progress-track">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-800">Matched skills</p>
          <p className="mt-2 text-sm text-slate-700">Java, MySQL, HTML, CSS</p>
        </div>
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-bold text-rose-800">Missing skills</p>
          <p className="mt-2 text-sm text-slate-700">Spring Boot, REST APIs, Docker, AWS</p>
        </div>
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-800">Recommended next</p>
          <p className="mt-2 text-sm text-slate-700">Week 1: REST APIs. Week 2: Spring Boot.</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const Home = () => {
  const { user } = useAuth();
  const primaryPath = user ? '/dashboard' : '/register';

  return (
    <div className="np-page">
      <section className="saas-grid border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-16">
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="np-kicker mb-5 w-fit">
              <BriefcaseBusiness className="h-4 w-4" />
              Built for placement and job preparation
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Turn your resume into a job-ready interview plan.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              NeuroPrep AI helps you analyze your resume, detect skill gaps, practice targeted MCQ and coding rounds,
              simulate face-to-face interviews, and track one clear placement readiness score.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MotionLink
                to={primaryPath}
                className="np-button-primary px-5 py-3"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {user ? 'Open dashboard' : 'Start placement prep'}
                <ArrowRight className="h-4 w-4" />
              </MotionLink>
              <MotionLink
                to="/resume-analyzer"
                className="np-button-secondary px-5 py-3"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileText className="h-4 w-4" />
                Analyze resume
              </MotionLink>
              <MotionLink
                to="/practice"
                className="np-button-secondary px-5 py-3"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlayCircle className="h-4 w-4" />
                Practice now
              </MotionLink>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item.label} className="np-card p-4">
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <LandingPreview />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {proofPoints.map((point) => (
            <div key={point} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <div className="np-kicker mb-3">
              <Route className="h-4 w-4" />
              The NeuroPrep workflow
            </div>
            <h2 className="text-3xl font-bold text-slate-950 sm:text-4xl">
              One connected path from resume gaps to interview confidence.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              This is what makes the project stand out for placements: every feature connects to a measurable job-preparation outcome.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="np-card p-5"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.copy}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="np-kicker mb-3">
                <Zap className="h-4 w-4" />
                Placement-winning modules
              </div>
              <h2 className="max-w-3xl text-3xl font-bold text-slate-950 sm:text-4xl">
                Everything a fresher needs before applying and interviewing.
              </h2>
            </div>
            <Link to="/dashboard" className="np-button-secondary w-fit">
              See dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="np-card p-6"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{feature.copy}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-cyan-200">
              <Trophy className="h-4 w-4" />
              Interview pitch ready
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              A project story recruiters can understand in 20 seconds.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              NeuroPrep AI is not just an interview website. It is an AI-powered placement intelligence platform that connects resume analysis, skill-gap practice, mock interviews, and analytics.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              'AI resume analyzer with ATS and job match score',
              'Skill-gap interview generation from missing skills',
              'MCQ, coding, and face-to-face practice flows',
              'Placement readiness dashboard for progress tracking',
            ].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/5 p-5">
                <CheckCircle2 className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-semibold leading-6 text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="np-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Start with your weakest placement signal.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Analyze your resume first, then let NeuroPrep AI guide your next MCQ, coding, and interview practice.
              </p>
            </div>
            <Link to="/resume-analyzer" className="np-button-primary mt-5 sm:mt-0">
              Analyze resume
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
