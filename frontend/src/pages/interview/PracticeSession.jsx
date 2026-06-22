import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Code2,
  Layers3,
  MonitorCog,
  UserRoundCheck,
} from 'lucide-react';
import { createPracticeProblem, normalizeTopic, toTitleCase } from '../../utils/practiceProblemFactory';

const difficultyOptions = ['easy', 'medium', 'hard'];

export default function PracticeSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state || {};
  const initialTopics = useMemo(() => {
    const topics = Array.isArray(session.topics) ? session.topics : [];
    const merged = [session.topic, ...topics].map(normalizeTopic).filter(Boolean);
    return [...new Set(merged)];
  }, [session.topic, session.topics]);

  const title = session.language || session.tool || session.domainTitle || 'Practice Session';
  const sessionType = session.type || (session.domainTitle ? 'domain' : 'practice');
  const [selectedTopic, setSelectedTopic] = useState(initialTopics[0] || title);
  const [difficulty, setDifficulty] = useState(session.difficulty || 'medium');

  const launchState = {
    jobRole: title,
    trackTitle: title,
    trackGroup: 'tech',
    subject: selectedTopic,
    topic: selectedTopic,
    subTopicDescription: `${toTitleCase(sessionType)} practice for ${title}`,
    difficulty,
    topics: initialTopics.map((topic) => ({ name: topic, desc: `${title} practice topic` })),
    source: 'practice-session',
  };

  const launchMCQ = () => {
    navigate('/mcq-interview', { state: { ...launchState, mode: 'MCQ' } });
  };

  const launchFaceToFace = () => {
    navigate('/face-to-face-interview', {
      state: {
        ...launchState,
        mode: 'Interview Person to Person',
        duration: 5,
        numberOfQuestions: 5,
      },
    });
  };

  const launchCoding = () => {
    navigate('/compiler', {
      state: {
        ...launchState,
        mode: 'Coding Compiler',
        selectedTopic,
        problemData: createPracticeProblem(selectedTopic, difficulty),
      },
    });
  };

  if (!location.state) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <button
            type="button"
            onClick={() => navigate('/practice')}
            className="mb-6 inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to practice
          </button>
          <h1 className="text-3xl font-bold text-slate-950">Choose a practice topic first</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Open a language, domain, or framework from the practice library to start a focused session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="saas-grid min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            {toTitleCase(sessionType)} practice
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Select a topic and launch it into MCQ, coding, or face-to-face interview practice.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Current focus</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{selectedTopic}</p>
              <p className="mt-1 text-sm capitalize text-slate-600">{difficulty} difficulty</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Topics</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {initialTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selectedTopic === topic
                      ? 'border-cyan-400 bg-cyan-50 text-cyan-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-white'
                  }`}
                >
                  <span className="font-semibold">{topic}</span>
                  <span className="mt-1 block text-xs text-slate-500">{title} focused practice</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Session setup</h2>
            <div className="mt-4 space-y-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDifficulty(option)}
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm font-semibold capitalize transition ${
                    difficulty === option
                      ? 'border-cyan-400 bg-cyan-50 text-cyan-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'MCQ Interview',
              copy: 'Generate targeted multiple-choice questions.',
              icon: BrainCircuit,
              action: launchMCQ,
            },
            {
              title: 'Coding Compiler',
              copy: 'Open a runnable starter challenge.',
              icon: MonitorCog,
              action: launchCoding,
            },
            {
              title: 'Face-to-Face',
              copy: 'Start a spoken AI interview setup.',
              icon: UserRoundCheck,
              action: launchFaceToFace,
            },
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.title}
                type="button"
                onClick={mode.action}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">{mode.title}</h3>
                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{mode.copy}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
                  Start
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            <p className="text-sm leading-6 text-slate-200">
              Coding practice opens with a starter challenge so the compiler has test cases immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
