import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';

const onboardingValue = [
  { icon: BrainCircuit, title: 'Adaptive AI practice', copy: 'Start role-aware mock interviews with instant coaching.' },
  { icon: BarChart3, title: 'Readiness analytics', copy: 'Watch confidence, accuracy, and skill gaps improve over time.' },
  { icon: CalendarCheck, title: 'Interview operations', copy: 'Join scheduled interviews, contests, and cohort workflows.' },
];

const GoogleMark = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signInWithGoogle, signUpWithEmail } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleEmailSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUpWithEmail(email, password);

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast.error('This email is already registered. Please login instead.', {
            position: 'top-right',
            autoClose: 4000,
          });
        } else {
          toast.error(`Registration failed: ${error.message}`, {
            position: 'top-right',
            autoClose: 4000,
          });
        }
        return;
      }

      toast.success('Welcome to NeuroPrep AI. Redirecting to your dashboard...', {
        autoClose: 3000,
        position: 'top-center',
      });

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.', {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(`Google Sign-In failed: ${error.message}`, {
          autoClose: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      toast.error('Google Sign-In failed. Please try again.', {
        autoClose: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-grid min-h-[calc(100vh-65px)] bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-145px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Create your workspace</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Start free and build a measurable interview readiness plan.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {loading ? 'Signing up...' : 'Continue with Google'}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/Login" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Sign in
            </Link>
          </p>
        </motion.section>

        <motion.section
          className="hidden lg:block"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Built for learners and campuses
          </div>
          <h2 className="text-4xl font-bold text-slate-950">Launch your AI interview readiness system.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            NeuroPrep AI packages mock interviews, analytics, contests, and scheduling into one product-ready SaaS experience.
          </p>

          <div className="mt-8 space-y-4">
            {onboardingValue.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-slate-950">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.copy}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-teal-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Free account includes mock practice and starter analytics
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Register;
