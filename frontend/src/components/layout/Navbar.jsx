import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';
import {
  BrainCircuit,
  FileText,
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Practice', href: '/practice', icon: PlayCircle },
  { name: 'Interview Preparation', href: '/interview-preparation', icon: BrainCircuit },
  { name: 'Resume', href: '/resume-analyzer', icon: FileText },
  { name: 'Contests', href: '/contests', icon: Trophy },
];

const navClassName = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-white text-slate-950 shadow-sm'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
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
      className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 text-white shadow-[0_10px_30px_rgba(7,17,31,0.16)] backdrop-blur"
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="NeuroPrep AI home">
          <img src={Logo} alt="" className="h-10 w-10 rounded-md border border-white/15 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-5 text-white">NeuroPrep AI</p>
            <p className="hidden text-xs font-medium text-slate-300 sm:block">Placement intelligence platform</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 md:flex">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                title={user.email || 'Account'}
                aria-label="Open account dashboard"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-rose-300/40 hover:bg-rose-500/10 hover:text-rose-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/Login"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-100 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="border-t border-white/10 bg-[#07111f] px-4 py-4 shadow-lg md:hidden"
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

            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/Login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
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
