import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Gauge,
  Layers3,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Workflow,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const platformStats = [
  { label: 'Interview readiness', value: '92%', detail: '+18% this month' },
  { label: 'AI sessions analyzed', value: '12.8K', detail: 'Across 6 tracks' },
  { label: 'Avg. feedback latency', value: '4s', detail: 'Speech, code, and rubric' },
];

const modules = [
  {
    icon: Video,
    title: 'Face-to-face AI interviews',
    desc: 'Run realistic voice and avatar-led interview rounds with structured evaluation for every answer.',
  },
  {
    icon: Code2,
    title: 'Coding round intelligence',
    desc: 'Combine compiler practice, submissions, and technical scoring into one candidate readiness view.',
  },
  {
    icon: LineChart,
    title: 'Performance analytics',
    desc: 'Track confidence, accuracy, communication, speed, and topic gaps across every practice session.',
  },
  {
    icon: CalendarCheck,
    title: 'Scheduled interview ops',
    desc: 'Create managed interview windows, monitor participation, and keep preparation workflows organized.',
  },
  {
    icon: MessageSquareText,
    title: 'AI coaching companion',
    desc: 'Give learners targeted next steps, follow-up prompts, and explanations based on their real activity.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin-grade control',
    desc: 'Package cohorts, contests, registrations, and score review into a dependable SaaS workspace.',
  },
];

const workflowSteps = [
  {
    title: 'Assess',
    desc: 'Capture resume context, selected role, skill track, and round type before the mock starts.',
  },
  {
    title: 'Simulate',
    desc: 'Run MCQ, coding, behavioral, and face-to-face rounds with adaptive AI prompts.',
  },
  {
    title: 'Coach',
    desc: 'Turn transcript, code, and performance signals into a practical improvement plan.',
  },
  {
    title: 'Operate',
    desc: 'Let admins schedule interviews, review cohort progress, and export performance records.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    audience: 'For individual learners',
    features: ['3 AI mock interviews', 'Core question bank', 'Basic performance report'],
  },
  {
    name: 'Pro',
    price: '₹499',
    audience: 'For serious job seekers',
    features: ['Unlimited practice rounds', 'AI coach history', 'Coding and face-to-face feedback'],
    featured: true,
  },
  {
    name: 'Campus',
    price: 'Custom',
    audience: 'For colleges and teams',
    features: ['Admin scheduling', 'Cohort analytics', 'Contest and interview exports'],
  },
];

const faqs = [
  {
    question: 'Can NeuroPrep AI support multiple interview types?',
    answer: 'Yes. The product is designed around technical, MCQ, behavioral, coding, and face-to-face interview flows.',
  },
  {
    question: 'Is this built for individuals or institutions?',
    answer: 'Both. Learners get guided practice, while admins can schedule interviews, manage contests, and review performance.',
  },
  {
    question: 'What makes it feel like a SaaS product?',
    answer: 'The experience now emphasizes dashboards, plans, workflow modules, analytics, admin controls, and clear conversion paths.',
  },
];

const MotionLink = motion(Link);

const SectionHeading = ({ eyebrow, title, copy }) => (
  <div className="mx-auto mb-10 max-w-3xl text-center">
    <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      {eyebrow}
    </div>
    <h2 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">{title}</h2>
    <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{copy}</p>
  </div>
);

const ProductConsole = () => (
  <motion.div
    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
    initial={{ opacity: 0, y: 26 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.15 }}
  >
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Command center</p>
        <h3 className="mt-1 text-lg font-semibold text-white">Readiness workspace</h3>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
        <Activity className="h-4 w-4" aria-hidden="true" />
        Live AI
      </div>
    </div>

    <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[150px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
        <div className="space-y-2 text-sm">
          {[
            { icon: Gauge, label: 'Overview', active: true },
            { icon: Video, label: 'Rounds' },
            { icon: BarChart3, label: 'Reports' },
            { icon: Users, label: 'Cohorts' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                  item.active ? 'bg-slate-950 text-white' : 'text-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {platformStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="text-2xl font-bold text-slate-950">{stat.value}</span>
                <span className="text-xs font-semibold text-emerald-700">{stat.detail}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="rounded-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Active interview pipeline</p>
                <p className="text-xs text-slate-500">AI-guided rounds for this week</p>
              </div>
              <BadgeCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { name: 'Technical coding', score: 86, color: 'bg-cyan-500' },
                { name: 'Behavioral depth', score: 74, color: 'bg-amber-500' },
                { name: 'System design', score: 69, color: 'bg-rose-500' },
              ].map((round) => (
                <div key={round.name} className="px-4 py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{round.name}</span>
                    <span className="font-semibold text-slate-950">{round.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-md bg-slate-100">
                    <div className={`h-full ${round.color}`} style={{ width: `${round.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="mb-5 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <p className="font-semibold text-white">AI next action</p>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              Schedule one system design drill and review communication pacing before the next live round.
            </p>
            <div className="mt-5 rounded-md bg-white/10 p-3">
              <p className="text-xs uppercase tracking-widest text-cyan-200">Confidence lift</p>
              <p className="mt-2 text-2xl font-bold text-white">+21%</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Today&apos;s coaching queue</p>
              <p className="text-xs text-slate-500">Generated from transcripts, submissions, and admin schedules</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
              <Zap className="h-4 w-4" aria-hidden="true" />
              6 recommendations ready
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const Home = () => {
  const { user } = useAuth();
  const primaryPath = user ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="saas-grid border-b border-slate-200 bg-[#f7f9fc]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:py-16">
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
              <BrainCircuit className="h-4 w-4" aria-hidden="true" />
              AI SaaS product design
            </div>
            <h1 className="text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              NeuroPrep AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              An interview intelligence platform for learners, colleges, and hiring-prep teams. Run AI mock interviews,
              analyze performance, schedule cohorts, and turn every practice session into a measurable readiness plan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MotionLink
                to={primaryPath}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 hover:bg-slate-800"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {user ? 'Open dashboard' : 'Start free'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MotionLink>
              <MotionLink
                to="/mock-interviews"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-cyan-300 hover:text-cyan-700"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Preview practice
              </MotionLink>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ClipboardCheck, label: 'Rubric scoring' },
                { icon: LockKeyhole, label: 'Role-based auth' },
                { icon: Building2, label: 'Campus ready' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
                    <Icon className="h-4 w-4 text-teal-600" aria-hidden="true" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <ProductConsole />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {platformStats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
              </div>
              <span className="text-sm font-semibold text-teal-700">{stat.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Product modules"
            title="A SaaS workspace for the whole interview journey"
            copy="NeuroPrep AI now reads as a product system: practice flows, AI intelligence, admin operations, and performance reporting all sit in one coherent experience."
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, idx) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{module.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              <Workflow className="h-4 w-4" aria-hidden="true" />
              AI workflow
            </div>
            <h2 className="text-3xl font-bold text-slate-950 sm:text-4xl">
              From raw practice to measurable readiness.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The SaaS design is built around a repeatable loop that makes the product feel operational, not just informational.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-6"
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-600 text-sm font-bold text-white">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-slate-950">{step.title}</h3>
                </div>
                <p className="text-sm leading-6 text-slate-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-cyan-200">
                <Layers3 className="h-4 w-4" aria-hidden="true" />
                Product tiers
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Pricing structure that feels ready for SaaS.</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Clear tiers make the product easy to understand for learners, power users, and campus-level buyers.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-6 ${
                    plan.featured
                      ? 'border-cyan-300 bg-cyan-300 text-slate-950'
                      : 'border-white/15 bg-white/5 text-white'
                  }`}
                >
                  <p className={`text-sm font-semibold ${plan.featured ? 'text-cyan-900' : 'text-cyan-200'}`}>{plan.name}</p>
                  <p className="mt-3 text-3xl font-bold">{plan.price}</p>
                  <p className={`mt-2 text-sm ${plan.featured ? 'text-slate-700' : 'text-slate-300'}`}>{plan.audience}</p>
                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Buyer clarity"
            title="Designed to explain, convert, and scale"
            copy="The redesigned surface presents NeuroPrep AI as a serious AI SaaS platform while preserving the learning and interview features already in the project."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-base font-bold text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="text-lg font-bold text-slate-950">Ready to launch the new product experience?</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start with the learner dashboard or jump into a mock interview to see the SaaS flow in action.
              </p>
            </div>
            <Link
              to={primaryPath}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 sm:mt-0"
            >
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
