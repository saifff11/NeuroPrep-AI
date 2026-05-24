import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';

const proofPoints = [
  'AI interview scoring',
  'Coding and behavioral rounds',
  'Progress dashboards',
  'Scheduled interview operations',
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signInWithEmail, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password', {
        autoClose: 3000,
        position: 'top-right',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);

      if (error) {
        toast.error(`Login failed: ${error.message}`, {
          autoClose: 4000,
          position: 'top-right',
        });
        return;
      }

      toast.success('Login successful. Welcome back.', {
        autoClose: 2000,
        position: 'top-right',
      });

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.', {
        autoClose: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      <div className="mx-auto grid min-h-[calc(100vh-145px)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          className="hidden lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            NeuroPrep AI workspace
          </div>
          <h1 className="text-4xl font-bold text-slate-950">Sign in to your interview command center.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Continue tracking readiness, reviewing AI feedback, and managing every mock interview round from one SaaS dashboard.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
                {point}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="mb-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
              <LogIn className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Access your AI practice history and performance reports.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
              Secure auth
            </div>
            <Link to="/register" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Create account
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Login;
