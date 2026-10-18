import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Radio,
  Share2,
  BarChart2,
  Shield,
  Zap,
  QrCode,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onExplorePricing: () => void;
}

export const LandingPage: React.FC<LandingProps> = ({
  onGetStarted,
  onExplorePricing,
}) => {
  const [selectedDemoOption, setSelectedDemoOption] = useState<number | null>(0);

  // Realistic poll preview with realistic live responses
  const demoOptions = [
    { text: 'TypeScript + Go Microservices', votes: 1420, pct: 45 },
    { text: 'Python FastAPI + React', votes: 948, pct: 30 },
    { text: 'Rust Backend + Next.js', votes: 474, pct: 15 },
    { text: 'Java Spring Boot Cloud', votes: 316, pct: 10 },
  ];

  const totalDemoVotes = demoOptions.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="relative overflow-hidden">
      {/* Light & Dark Hero Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-200/50 via-teal-100/30 to-transparent dark:from-brand-600/15 dark:via-pulse-teal/10 dark:to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-brand-500/30 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-8 shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-pulse-teal animate-ping" />
          <span>Real-Time Polling & Audience Intelligence Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.1] mb-6"
        >
          Turn Every Opinion Into{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-600 to-pulse-teal dark:from-brand-400 dark:via-indigo-300 dark:to-pulse-teal">
            Real-Time Insight.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Create engaging polls, share them instantly, and watch your audience's responses come alive in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            <span>Create Your First Poll</span>
            <ArrowRight size={16} />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 glass-card hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <span>Explore Features</span>
          </a>
        </motion.div>

        {/* Live Interactive Hero Poll Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto text-left rounded-2xl glass-panel p-6 sm:p-8 shadow-xl relative"
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-pulse-teal animate-pulse" />
              <span className="text-xs font-bold text-pulse-teal uppercase tracking-wider">
                Live Interactive Preview
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Radio size={14} className="text-brand-600 dark:text-brand-400 animate-pulse" />
              <span>{totalDemoVotes.toLocaleString()} live responses</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            What backend technology stack do you trust most for real-time scale?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Sample demonstration preview with simulated live telemetry. Click any option to see the interactive pulse!
          </p>

          <div className="space-y-3">
            {demoOptions.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDemoOption(idx)}
                className={`relative overflow-hidden rounded-xl p-3.5 border transition cursor-pointer ${
                  selectedDemoOption === idx
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual percentage progress bar */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ${
                    selectedDemoOption === idx
                      ? 'bg-brand-500/15 dark:bg-brand-500/20'
                      : 'bg-slate-200/60 dark:bg-slate-800/40'
                  }`}
                  style={{ width: `${opt.pct}%` }}
                />

                <div className="relative flex items-center justify-between z-10 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedDemoOption === idx
                          ? 'border-brand-600 dark:border-brand-400 bg-brand-600 dark:bg-brand-500 text-white'
                          : 'border-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {selectedDemoOption === idx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{opt.text}</span>
                  </div>

                  <div className="flex items-center gap-2.5 font-bold">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{opt.votes} votes</span>
                    <span className="text-brand-600 dark:text-brand-400 font-mono text-sm">{opt.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Powered by Go, Redis Pub/Sub & WebSockets</span>
            <span className="text-pulse-teal font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Synchronized Live
            </span>
          </div>
        </motion.div>
      </section>

      {/* Feature Sections */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
            Engineered For Audience Engagement
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Everything you need to gather opinions, conduct instant live ballots, and analyze responses at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Zap className="text-amber-500" size={24} />,
              title: 'Instant Live Voting',
              desc: 'Sub-second real-time vote aggregation powered by Redis Pub/Sub channels and WebSocket streams.',
            },
            {
              icon: <Share2 className="text-brand-600 dark:text-brand-400" size={24} />,
              title: 'Shareable Poll Links',
              desc: 'Every poll receives an instant, unpredictable unique link ready for immediate distribution.',
            },
            {
              icon: <QrCode className="text-pulse-teal" size={24} />,
              title: 'QR Code Generation',
              desc: 'Audience members in auditoriums or video meetings can scan and vote in seconds from mobile.',
            },
            {
              icon: <BarChart2 className="text-indigo-600 dark:text-indigo-400" size={24} />,
              title: 'Beautiful Analytics',
              desc: 'Live interactive bar charts, percentages, and telemetry that update without page refreshes.',
            },
            {
              icon: <Shield className="text-emerald-500" size={24} />,
              title: 'Secure Accounts & Protection',
              desc: 'Bcrypt password encryption, signed JWT tokens, and abuse-resistant duplicate voting prevention.',
            },
            {
              icon: <Sparkles className="text-violet-500" size={24} />,
              title: 'Free & Premium Plans',
              desc: 'Get started with 10 free polls forever. Upgrade seamlessly to unlock unlimited polling.',
            },
            {
              icon: <Radio className="text-rose-500" size={24} />,
              title: 'Real-Time Audience Pulse',
              desc: 'Watch sentiment shifts live during keynotes, webinars, university lectures, and standups.',
            },
            {
              icon: <CheckCircle2 className="text-cyan-500" size={24} />,
              title: 'Mobile-Optimized Voting',
              desc: 'Responsive, lightweight voting interface designed for mobile phones and low-bandwidth connections.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl glass-card hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-pulse-teal uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
            Four Steps From Question to Pulse
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Experience zero friction from poll creation to real-time telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Create Poll', desc: 'Define your question, add 2 or more options, and choose optional settings.' },
            { step: '02', title: 'Share Link', desc: 'Distribute your unique Votexa link or display the QR code on your presentation screen.' },
            { step: '03', title: 'Audience Votes', desc: 'Participants cast single-choice votes instantly from their smartphone or browser.' },
            { step: '04', title: 'Watch Live Results', desc: 'Redis and WebSockets broadcast updates in real time without manual page refreshes.' },
          ].map((item, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl glass-card">
              <span className="text-3xl font-black text-slate-300 dark:text-slate-700 mb-3 block">{item.step}</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-900">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does real-time voting work without page refreshes?',
              a: 'When an audience member submits a vote, the Go backend verifies it, writes it to MongoDB, and publishes an event to Redis Pub/Sub. The server’s WebSocket hub receives this event and streams the updated counts to all connected clients instantly.',
            },
            {
              q: 'Is registration required to vote in a poll?',
              a: 'No! Audience members can vote anonymously via your shareable link without creating an account. Registration is only required to create and manage polls.',
            },
            {
              q: 'How does the Free plan 10-poll limit work?',
              a: 'Every newly created account can create up to 10 polls cumulatively. Once you reach 10 polls, you can upgrade to Premium to continue creating unlimited polls. All existing polls and results remain fully accessible.',
            },
            {
              q: 'How is duplicate voting prevented?',
              a: 'For authenticated accounts, uniqueness is enforced by account ID. For public voters, a cryptographic device fingerprint combines with MongoDB unique indexes to prevent multiple submissions on the same poll.',
            },
            {
              q: 'What is included in Votexa Premium?',
              a: 'Votexa Premium unlocks unlimited poll creation, CSV telemetry export, custom poll themes, and priority Redis real-time channels.',
            },
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-xl glass-card">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle size={16} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
                {item.q}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-900 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            Votexa — Every Voice. One Live Pulse.
          </div>
          <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition">Features</a>
            <button onClick={onExplorePricing} className="hover:text-slate-900 dark:hover:text-white transition">Pricing</button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500">Built with React, Go/Gin, MongoDB & Redis</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
