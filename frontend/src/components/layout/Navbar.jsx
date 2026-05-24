import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';
import {
  BarChart3,
  BrainCircuit,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PlayCircle,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import Logo from '../../assets/Logo.jpg';
import { useAuth } from '../../contexts/AuthContext';

const navLinks = [
  { name: 'Practice', href: '/practice', icon: PlayCircle },
  { name: 'Preparation', href: '/interview-preparation', icon: BrainCircuit },
  { name: 'Contests', href: '/contests', icon: Trophy },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
];

const navClassName = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-slate-950 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
  }`;

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="NeuroPrep AI home">
          <img src={Logo} alt="" className="h-10 w-10 rounded-md border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-5 text-slate-950">NeuroPrep AI</p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">Interview intelligence SaaS</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.name} to={link.href} className={navClassName}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.name}
              </NavLink>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700"
                title={user.email || 'Account'}
                aria-label="Open account dashboard"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/Login"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.name}
                    to={link.href}
                    className={navClassName}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {link.name}
                  </NavLink>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/Login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Start free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
