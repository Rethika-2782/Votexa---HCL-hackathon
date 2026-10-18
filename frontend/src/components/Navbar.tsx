import React from 'react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, PlusCircle, LogOut, LayoutDashboard, Crown, BarChart3, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'create' | 'pricing';
  setCurrentView: (view: 'landing' | 'dashboard' | 'create' | 'pricing') => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, openAuthModal }) => {
  const { user, usage, logout, openUpgradeModal } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => setCurrentView(user ? 'dashboard' : 'landing')}
          className="focus:outline-none"
        >
          <Logo size={34} />
        </button>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {!user && (
            <>
              <button
                onClick={() => setCurrentView('landing')}
                className={`transition ${
                  currentView === 'landing'
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Features
              </button>
              <a
                href="#how-it-works"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                How It Works
              </a>
              <button
                onClick={() => setCurrentView('pricing')}
                className={`transition ${
                  currentView === 'pricing'
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pricing
              </button>
              <a
                href="#faq"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                FAQ
              </a>
            </>
          )}

          {user && (
            <>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 transition ${
                  currentView === 'dashboard'
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentView('create')}
                className={`flex items-center gap-1.5 transition ${
                  currentView === 'create'
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlusCircle size={16} />
                <span>Create Poll</span>
              </button>
              <button
                onClick={() => setCurrentView('pricing')}
                className={`flex items-center gap-1.5 transition ${
                  currentView === 'pricing'
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 size={16} />
                <span>Plans</span>
              </button>
            </>
          )}
        </nav>

        {/* Right side controls & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Theme switcher button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Color Theme"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition"
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-brand-600" />}
          </button>

          {!user ? (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="text-xs sm:text-sm font-semibold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/20 transition"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* Plan usage badge */}
              <button
                onClick={openUpgradeModal}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition ${
                  user.plan === 'premium'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/20 hover:border-brand-300 dark:hover:border-brand-500/40'
                }`}
              >
                {user.plan === 'premium' ? (
                  <>
                    <Crown size={12} className="text-amber-500" />
                    <span>PRO PLAN</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-brand-600 dark:text-brand-400" />
                    <span>Usage: {usage ? `${usage.pollCreationCount}/10` : '0/10'}</span>
                  </>
                )}
              </button>

              {/* User greeting */}
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
