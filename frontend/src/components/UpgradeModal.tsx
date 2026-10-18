import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, closeUpgradeModal, usage, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isUpgradeModalOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      await api.upgradePlan('premium', adminKey || undefined);
      setSuccess(true);
      await refreshUserData();
      setTimeout(() => {
        setSuccess(false);
        closeUpgradeModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Upgrade request rejected by backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg p-6 overflow-hidden rounded-2xl glass-panel border border-brand-500/30 shadow-2xl"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pulse-teal/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeUpgradeModal}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
          >
            <X size={18} />
          </button>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Check size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Welcome to Votexa Premium</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Your account plan has been verified and upgraded. You now have unlimited poll creation and advanced analytics!
              </p>
            </motion.div>
          ) : (
            <div>
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-full w-fit mb-3">
                <Sparkles size={13} className="text-brand-400" />
                <span>Limit Reached or Pro Upgrade</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Unlock Unlimited Real-Time Polling
              </h2>

              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                Free accounts have a strict limit of <strong className="text-slate-200">10 polls</strong> ({usage?.pollCreationCount || 10}/10 used). Upgrade to the <span className="text-brand-400 font-semibold">Votexa Premium</span> plan to create unlimited polls with live telemetry.
              </p>

              {/* Feature comparison highlights */}
              <div className="space-y-2.5 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                {[
                  'Unlimited active and archived polls',
                  'Instant CSV telemetry & response export',
                  'Custom branded styling & accent colors',
                  'Priority Redis Pub/Sub distribution channels',
                  'Direct audience engagement analytics',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center">
                      <Check size={10} />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Price card */}
              <div className="flex items-center justify-between p-4 mb-4 rounded-xl bg-gradient-to-r from-brand-950/60 to-slate-900 border border-brand-500/30">
                <div>
                  <div className="text-xs text-brand-300 font-medium">Pro Audience Tier</div>
                  <div className="text-2xl font-black text-white">
                    $19 <span className="text-xs text-slate-400 font-normal">/ month (sandbox tier)</span>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Backend Activation
                </span>
              </div>

              {error && (
                <div className="p-3 mb-4 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  {error}
                </div>
              )}

              {/* Development sandbox activation or admin key */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowAdminInput(!showAdminInput)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 mb-2"
                >
                  <Lock size={11} /> {showAdminInput ? 'Hide Admin/Key Field' : 'Enter Admin Provision Key (Optional in Dev)'}
                </button>
                {showAdminInput && (
                  <input
                    type="password"
                    placeholder="ADMIN_SECRET_KEY (default: votexa-admin-secret-provision-2026)"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={closeUpgradeModal}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
                >
                  Keep Free Plan
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    'Verifying...'
                  ) : (
                    <>
                      <span>Activate Premium</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
