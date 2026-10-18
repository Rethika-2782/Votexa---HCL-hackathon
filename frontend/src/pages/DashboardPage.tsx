import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  BarChart3,
  Users,
  Vote,
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Lock,
  Download,
  QrCode as QrIcon
} from 'lucide-react';
import type { Poll } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardProps {
  onCreatePoll: () => void;
  onOpenPoll: (code: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onCreatePoll, onOpenPoll }) => {
  const { user, usage, openUpgradeModal, refreshUserData } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrModalPoll, setQrModalPoll] = useState<Poll | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await api.getUserPolls();
      setPolls(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
    refreshUserData();
  }, []);

  const totalVotesAcrossPolls = polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
  const activePollsCount = polls.filter((p) => p.status === 'active').length;

  const copyShareLink = (code: string) => {
    const url = `${window.location.origin}/poll/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClosePoll = async (code: string) => {
    try {
      await api.closePoll(code);
      await fetchPolls();
    } catch (err: any) {
      setActionError(err.message || 'Failed to close poll');
    }
  };

  const handleDeletePoll = async (code: string) => {
    if (!window.confirm('Are you sure you want to delete this poll? Existing responses will be permanently removed.')) {
      return;
    }
    try {
      await api.deletePoll(code);
      await fetchPolls();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete poll');
    }
  };

  const handleExportCSV = (code: string) => {
    if (user?.plan !== 'premium') {
      openUpgradeModal();
      return;
    }
    const token = localStorage.getItem('votexa_token');
    const exportUrl = api.getExportUrl(code);
    fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `votexa_poll_${code}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  const filteredPolls = polls.filter((p) =>
    p.question.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name || 'Creator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time audience intelligence telemetry & live ballot coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreatePoll}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/20 transition flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>Create New Poll</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 mb-6 text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Polls Created</span>
            <BarChart3 size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{polls.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lifetime links created: {usage?.pollCreationCount || 0}</div>
        </div>

        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Live Ballots</span>
            <span className="w-2 h-2 rounded-full bg-pulse-teal animate-ping" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{activePollsCount}</div>
          <div className="text-[11px] text-pulse-teal font-medium mt-1">Accepting real-time votes</div>
        </div>

        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Audience Votes</span>
            <Users size={16} className="text-pulse-violet" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalVotesAcrossPolls}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Persisted in MongoDB</div>
        </div>

        {/* Free Plan Usage Bar / Pro Status */}
        <div className="p-5 rounded-2xl glass-card border border-brand-200 dark:border-brand-500/20 bg-brand-50/50 dark:bg-brand-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                {user?.plan === 'premium' ? 'Pro Plan Status' : 'Free Plan Usage'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {user?.plan === 'premium' ? 'Unlimited' : `${usage?.pollCreationCount || 0}/10`}
              </span>
            </div>

            {/* Progress bar */}
            {user?.plan !== 'premium' ? (
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((usage?.pollCreationCount || 0) / 10) * 100, 100)}%` }}
                />
              </div>
            ) : (
              <div className="text-[11px] text-amber-600 dark:text-amber-300 font-semibold mb-2">
                Unlimited poll creation verified
              </div>
            )}
          </div>

          {user?.plan !== 'premium' && (
            <button
              onClick={openUpgradeModal}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <Sparkles size={12} />
              <span>Upgrade to Pro Tier</span>
            </button>
          )}
        </div>
      </div>

      {/* Polls List Section */}
      <div className="glass-panel rounded-2xl overflow-hidden p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Polls</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Share live links, monitor real-time updates, or export telemetry.</p>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search polls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Fetching polls from backend...
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
              <Vote size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {search ? 'No matching polls found' : "You haven't created your first poll yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
              {search
                ? 'Try a different search query'
                : 'Create engaging polls, share them instantly, and observe real-time telemetry.'}
            </p>
            {!search && (
              <button
                onClick={onCreatePoll}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-500 transition shadow-md shadow-brand-500/20"
              >
                Create Your First Poll
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredPolls.map((poll) => (
              <div
                key={poll.id}
                className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/30 -mx-5 sm:-mx-6 px-5 sm:px-6 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        poll.status === 'active'
                          ? 'bg-pulse-teal/10 text-teal-700 dark:text-pulse-teal border border-teal-200 dark:border-pulse-teal/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {poll.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-pulse-teal animate-pulse" />}
                      {poll.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Code: {poll.code}</span>
                  </div>

                  <h3
                    onClick={() => onOpenPoll(poll.code)}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition cursor-pointer truncate"
                  >
                    {poll.question}
                  </h3>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{poll.totalVotes || 0} votes recorded</span>
                    <span>•</span>
                    <span>{poll.options.length} options</span>
                    <span>•</span>
                    <span>Created {new Date(poll.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyShareLink(poll.code)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                    title="Copy Public Link"
                  >
                    {copiedCode === poll.code ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={() => setQrModalPoll(poll)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                    title="View QR Code"
                  >
                    <QrIcon size={14} />
                  </button>

                  <button
                    onClick={() => handleExportCSV(poll.code)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition"
                    title="Export CSV Telemetry"
                  >
                    <Download size={14} />
                  </button>

                  {poll.status === 'active' && (
                    <button
                      onClick={() => handleClosePoll(poll.code)}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-600 transition"
                      title="Close Poll"
                    >
                      <Lock size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeletePoll(poll.code)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Poll"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    onClick={() => onOpenPoll(poll.code)}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-600/30 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>Open Live View</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Scan to Vote</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 truncate">{qrModalPoll.question}</p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-md border border-slate-100 mb-4">
              <QRCodeSVG
                value={`${window.location.origin}/poll/${qrModalPoll.code}`}
                size={180}
                level="M"
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-5 truncate">
              {`${window.location.origin}/poll/${qrModalPoll.code}`}
            </div>

            <button
              onClick={() => setQrModalPoll(null)}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Close QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
