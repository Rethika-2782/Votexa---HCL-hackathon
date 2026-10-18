import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode as QrIcon,
  Users,
  AlertCircle,
  Wifi,
  WifiOff,
  ArrowLeft
} from 'lucide-react';
import type { Poll, VoteActivityItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface PollViewProps {
  code: string;
  onBack: () => void;
}

export const PollViewPage: React.FC<PollViewProps> = ({ code, onBack }) => {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voterName, setVoterName] = useState(user?.name || '');
  const [voters, setVoters] = useState<VoteActivityItem[]>([]);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);

  const loadPoll = async () => {
    try {
      setLoading(true);
      const data = await api.getPublicPoll(code);
      setPoll(data.poll);
      setHasVoted(data.hasVoted);
      setVotedOptionId(data.votedOptionId || null);

      try {
        const votesData = await api.getPollVotes(code);
        setVoters(votesData);
      } catch (e) {
        console.warn('Could not load votes list', e);
      }
    } catch (err: any) {
      setError(err.message || 'Poll not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoll();

    const wsUrl = api.getWebSocketUrl(code);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (update.type === 'NEW_VOTE' || update.type === 'POLL_UPDATED') {
          setPoll((prev) => {
            if (!prev) return null;
            const updatedOptions = prev.options.map((opt) => ({
              ...opt,
              voteCount: update.optionVotes?.[opt.id] ?? opt.voteCount,
            }));
            return {
              ...prev,
              totalVotes: update.totalVotes ?? prev.totalVotes + 1,
              options: updatedOptions,
            };
          });

          if (update.voterName) {
            setVoters((prev) => [
              {
                id: 'ws_' + Date.now(),
                voterName: update.voterName,
                optionId: update.optionId || '',
                optionText: update.optionText || '',
                createdAt: update.timestamp || new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        } else if (update.type === 'POLL_CLOSED') {
          setPoll((prev) => (prev ? { ...prev, status: 'closed' } : null));
        }
      } catch (e) {
        console.error('Failed to parse WebSocket event', e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [code]);

  const handleVote = async () => {
    if (!selectedOption || !poll || hasVoted) return;

    setSubmittingVote(true);
    setError('');

    try {
      const trimmedName = voterName.trim() || user?.name || 'Audience Member';
      const res = await api.castVote(code, selectedOption, trimmedName);
      setHasVoted(true);
      setVotedOptionId(selectedOption);

      setPoll((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalVotes: res.totalVotes,
          options: res.options,
        };
      });

      const chosenOpt = poll.options.find((o) => o.id === selectedOption);
      setVoters((prev) => [
        {
          id: 'v_' + Date.now(),
          voterName: trimmedName,
          optionId: selectedOption,
          optionText: chosenOpt?.text || '',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      if (err.code === 'ALREADY_VOTED' || err.message?.includes('already')) {
        setHasVoted(true);
        setError('You have already cast a vote in this poll.');
      } else {
        setError(err.message || 'Failed to submit vote');
      }
    } finally {
      setSubmittingVote(false);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Connecting to live audience pulse stream...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Poll Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          This poll may have been deleted by its creator or the code is incorrect.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isClosed = poll.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Bar with Back and Live Socket Indicator */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              wsConnected
                ? 'bg-pulse-teal/10 text-teal-700 dark:text-pulse-teal border border-teal-200 dark:border-pulse-teal/30'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
            }`}
          >
            {wsConnected ? <Wifi size={11} className="animate-pulse" /> : <WifiOff size={11} />}
            <span>{wsConnected ? 'Live Pulse Synchronized' : 'Reconnecting...'}</span>
          </div>

          <button
            onClick={copyShareLink}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            title="Copy Share Link"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>

          <button
            onClick={() => setShowQr(!showQr)}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            title="Display QR Code"
          >
            <QrIcon size={14} />
          </button>
        </div>
      </div>

      {/* QR Code Presentation Drawer */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-6 rounded-2xl glass-panel text-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Audience QR Code</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Scan with any smartphone camera to open and vote on this live ballot.
              </p>
              <div className="p-3 bg-white rounded-xl inline-block shadow-md border border-slate-100">
                <QRCodeSVG value={window.location.href} size={150} level="M" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Poll Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl shadow-xl relative"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isClosed
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
              }`}
            >
              {isClosed ? 'Closed' : 'Active Ballot'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Code: {poll.code}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Users size={14} className="text-pulse-teal" />
            <span>{poll.totalVotes} total responses</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
          {poll.question}
        </h1>

        {poll.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{poll.description}</p>
        )}

        {error && (
          <div className="p-3 mb-5 text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {hasVoted && (
          <div className="p-3 mb-5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Your vote has been recorded. Live results update automatically below!</span>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {poll.options.map((option) => {
            const isVotedChoice = votedOptionId === option.id;
            const pct =
              poll.totalVotes > 0
                ? Math.round((option.voteCount / poll.totalVotes) * 100)
                : 0;

            return (
              <div
                key={option.id}
                onClick={() => {
                  if (!hasVoted && !isClosed) setSelectedOption(option.id);
                }}
                className={`relative overflow-hidden rounded-xl p-4 border transition ${
                  hasVoted || isClosed ? 'cursor-default' : 'cursor-pointer'
                } ${
                  selectedOption === option.id && !hasVoted
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-1 ring-brand-500'
                    : isVotedChoice
                    ? 'border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual percentage fill bar */}
                {(hasVoted || isClosed || poll.settings?.showResultsLive) && (
                  <motion.div
                    className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ${
                      isVotedChoice
                        ? 'bg-emerald-500/20 dark:bg-emerald-500/25'
                        : 'bg-brand-500/15 dark:bg-brand-500/20'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    {!hasVoted && !isClosed && (
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedOption === option.id
                            ? 'border-brand-600 dark:border-brand-400 bg-brand-600 dark:bg-brand-500 text-white'
                            : 'border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        {selectedOption === option.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    )}

                    {isVotedChoice && (
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    )}

                    <span className="font-semibold text-slate-900 dark:text-slate-100">{option.text}</span>
                  </div>

                  {(hasVoted || isClosed || poll.settings?.showResultsLive) && (
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">{option.voteCount} votes</span>
                      <span className="text-brand-600 dark:text-brand-400 font-mono text-sm">{pct}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Voter Name Input (before vote submission) */}
        {!hasVoted && !isClosed && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Name (Visible to Poll Creator & Audience)
            </label>
            <input
              type="text"
              placeholder="e.g. Rethika, Priya Sharma, or Arun Kumar"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        {/* Action Button */}
        {!hasVoted && !isClosed ? (
          <button
            onClick={handleVote}
            disabled={!selectedOption || submittingVote}
            className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {submittingVote ? (
              'Submitting Vote...'
            ) : (
              <>
                <span>Submit Vote</span>
                <CheckCircle2 size={16} />
              </>
            )}
          </button>
        ) : isClosed ? (
          <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
            This poll is closed and no longer accepting votes.
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            Thank you! Your response is recorded in the live telemetry stream.
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Created by {poll.ownerName || 'Verified Host'}</span>
          <span>Powered by Votexa Real-Time Core</span>
        </div>
      </motion.div>

      {/* LinkedIn Style Live Voter Activity Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 sm:p-7 rounded-2xl shadow-xl mt-6 relative"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              in
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Voter Activity & Responses</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20">
                  {voters.length} {voters.length === 1 ? 'response' : 'responses'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Real-time breakdown of voters and their choices (LinkedIn style)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Feed</span>
          </div>
        </div>

        {voters.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No votes recorded yet. Vote above to appear in this live pulse feed!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {voters.map((v, i) => {
              const initials = (v.voterName || 'VT')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <motion.div
                  key={v.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {v.voterName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <span>voted:</span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400 truncate">
                          "{v.optionText || 'Option'}"
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex-shrink-0">
                    {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
