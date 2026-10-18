import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CreatePollProps {
  onPollCreated: (code: string) => void;
  onCancel: () => void;
}

export const CreatePollPage: React.FC<CreatePollProps> = ({ onPollCreated, onCancel }) => {
  const { usage, openUpgradeModal, refreshUserData } = useAuth();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [theme, setTheme] = useState('brand');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (question.trim().length < 4) {
      return setError('Question must be at least 4 characters');
    }

    const filteredOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      return setError('Please provide at least 2 distinct answer options');
    }

    // Check duplicate options
    const unique = new Set(filteredOptions.map((o) => o.toLowerCase()));
    if (unique.size !== filteredOptions.length) {
      return setError('Duplicate option texts are not allowed');
    }

    setLoading(true);
    try {
      const res = await api.createPoll({
        question: question.trim(),
        description: description.trim(),
        options: filteredOptions,
        settings: {
          anonymousVoting: true,
          requireAuth: false,
          allowMultipleVotes: false,
          showResultsLive: true,
          theme,
        },
      });

      await refreshUserData();
      onPollCreated(res.poll.code);
    } catch (err: any) {
      if (err.code === 'POLL_LIMIT_REACHED' || err.message?.includes('POLL_LIMIT_REACHED')) {
        openUpgradeModal();
      } else {
        setError(err.message || 'Failed to create poll');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create a New Live Poll</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your poll will be assigned a unique shareable link and live WebSocket channel.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Plan Usage</span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {usage?.isUnlimited
                ? 'Unlimited (Pro)'
                : `${usage?.pollCreationCount || 0} / ${usage?.maxPolls || 10} used`}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-6 text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Poll Question <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Which architectural pattern should we adopt for our real-time streaming pipeline?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description or Context (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide background context or instructions for your audience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Answer Options <span className="text-rose-500">*</span> (min 2, max 8)
              </label>
              {options.length < 8 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Option
                </button>
              )}
            </div>

            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-6 text-center">{i + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Theme selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Visual Accent Color
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'brand', label: 'Indigo', bg: 'bg-brand-500' },
                { id: 'teal', label: 'Teal Pulse', bg: 'bg-pulse-teal' },
                { id: 'violet', label: 'Violet', bg: 'bg-pulse-violet' },
                { id: 'amber', label: 'Amber', bg: 'bg-pulse-amber' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                    theme === t.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-white dark:bg-slate-800 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${t.bg}`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-md shadow-brand-500/25 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                'Publishing Poll...'
              ) : (
                <>
                  <span>Publish & Generate Live Link</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
