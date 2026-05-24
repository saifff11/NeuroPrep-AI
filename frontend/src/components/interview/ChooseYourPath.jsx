import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Code2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const pathOptions = [
  {
    key: 'tech',
    title: 'Technical Tracks',
    eyebrow: 'Engineering readiness',
    copy: 'Coding, system design, security, data, and engineering interview tracks with AI-scored practice.',
    icon: Code2,
    accent: 'cyan',
    metrics: [
      { label: 'Core tracks', value: '3' },
      { label: 'Practice modes', value: '4' },
    ],
    skills: ['Software Engineering', 'Cybersecurity', 'Data Science'],
  },
  {
    key: 'nonTech',
    title: 'Business Tracks',
    eyebrow: 'Strategic role prep',
    copy: 'Product, design, leadership, and communication rounds for non-technical career paths.',
    icon: BriefcaseBusiness,
    accent: 'amber',
    metrics: [
      { label: 'Role systems', value: '3' },
      { label: 'Skill signals', value: '12+' },
    ],
    skills: ['Product Management', 'UI/UX Design', 'Leadership'],
  },
  {
    key: 'company',
    title: 'Company Tracks',
    eyebrow: 'Campus and hiring pipelines',
    copy: 'Company-specific interview preparation for aptitude, coding, technical, and HR rounds.',
    icon: Building2,
    accent: 'teal',
    metrics: [
      { label: 'Companies', value: '3' },
      { label: 'Round maps', value: '10+' },
    ],
    skills: ['Infosys', 'TCS', 'Cognizant'],
  },
];

const accentClasses = {
  cyan: {
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: 'bg-cyan-600 text-white',
    button: 'bg-cyan-600 hover:bg-cyan-700',
  },
  amber: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: 'bg-amber-500 text-slate-950',
    button: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
  },
  teal: {
    badge: 'border-teal-200 bg-teal-50 text-teal-700',
    icon: 'bg-teal-600 text-white',
    button: 'bg-teal-600 hover:bg-teal-700',
  },
};

export default function ChooseYourPath({ onSelectTrack }) {
  return (
    <div className="saas-grid min-h-[80vh] px-4 py-12 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI interview product workspace
          </div>
          <h1 className="text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
            Choose the readiness system you want to build.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
            Start from a track, then move into AI mock interviews, coding rounds, performance reports, and scheduled interview workflows.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {pathOptions.map((option, index) => {
            const Icon = option.icon;
            const accent = accentClasses[option.accent];

            return (
              <motion.button
                key={option.key}
                type="button"
                onClick={() => onSelectTrack(option.key)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="group flex min-h-[430px] flex-col rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-lg"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className={`inline-flex rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-widest ${accent.badge}`}>
                    {option.eyebrow}
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-md ${accent.icon}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-950">{option.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{option.copy}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {option.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-2xl font-bold text-slate-950">{metric.value}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{metric.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {option.skills.map((skill) => (
                    <span key={skill} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <span className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white ${accent.button}`}>
                    Open track
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
          {[
            { icon: Layers3, label: 'Track-specific round maps' },
            { icon: BarChart3, label: 'Performance intelligence' },
            { icon: ShieldCheck, label: 'Admin-ready operations' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <Icon className="h-4 w-4 text-cyan-600" aria-hidden="true" />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
