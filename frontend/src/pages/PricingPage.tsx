import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PricingProps {
  onSelectFree: () => void;
  onUpgrade?: () => void;
}

export const PricingPage: React.FC<PricingProps> = ({ onSelectFree }) => {
  const { user, openUpgradeModal } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Pricing Plans</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4 tracking-tight">
          Transparent, Scalable Audience Polling
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Start free with 10 poll links. Upgrade to Pro for unlimited audience reach and telemetry export.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-8 rounded-2xl glass-card flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-300">Free Starter</span>
              {user?.plan === 'free' && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  CURRENT PLAN
                </span>
              )}
            </div>

            <div className="mb-6">
              <span className="text-4xl font-black text-slate-900 dark:text-white">$0</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">/ forever</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Ideal for students, team standups, and occasional interactive presentations.
            </p>

            <div className="space-y-3 mb-8">
              {[
                'Strict cumulative limit of 10 poll links',
                'Real-time WebSocket & Redis updates',
                'Shareable link & mobile QR code generator',
                'Standard device fingerprint duplicate protection',
                'Community support',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Check size={14} className="text-pulse-teal flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onSelectFree}
            disabled={user?.plan === 'free'}
            className="w-full py-3 rounded-xl font-bold text-xs text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            {user?.plan === 'free' ? 'Current Active Plan' : 'Select Free Plan'}
          </button>
        </motion.div>

        {/* Premium Tier */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative p-8 rounded-2xl glass-panel border border-brand-300 dark:border-brand-500/40 shadow-xl flex flex-col justify-between"
        >
          <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-brand-600 to-pulse-teal text-white shadow-md">
            POPULAR FOR TEAMS
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
                <span>Pro Audience Intelligence</span>
              </span>
              {user?.plan === 'premium' && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  CURRENT PLAN
                </span>
              )}
            </div>

            <div className="mb-6">
              <span className="text-4xl font-black text-slate-900 dark:text-white">$19</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">/ month (sandbox tier)</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Designed for professional keynote speakers, educators, universities, and enterprise teams.
            </p>

            <div className="space-y-3 mb-8">
              {[
                'Unlimited active and archived poll links',
                'Downloadable CSV response telemetry',
                'Priority Redis Pub/Sub broadcast throughput',
                'Custom brand accents & poll theme palettes',
                'Extended analytics & live viewer metrics',
                'Server-verified activation with instant unlock',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                  <Check size={14} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={openUpgradeModal}
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            <span>{user?.plan === 'premium' ? 'Manage Pro Tier' : 'Upgrade to Pro'}</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
