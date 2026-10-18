import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreatePollPage } from './pages/CreatePollPage';
import { PollViewPage } from './pages/PollViewPage';
import { PricingPage } from './pages/PricingPage';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'create' | 'pricing'>('landing');
  const [activePollCode, setActivePollCode] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/poll\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setActivePollCode(match[1]);
    }
  }, []);

  useEffect(() => {
    if (user && currentView === 'landing' && !activePollCode) {
      setCurrentView('dashboard');
    }
  }, [user]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenPoll = (code: string) => {
    setActivePollCode(code);
    window.history.pushState({}, '', `/poll/${code}`);
  };

  const handleBackFromPoll = () => {
    setActivePollCode(null);
    window.history.pushState({}, '', '/');
    if (user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setActivePollCode(null);
          setCurrentView(view);
        }}
        openAuthModal={openAuth}
      />

      <main className="flex-1">
        {activePollCode ? (
          <PollViewPage code={activePollCode} onBack={handleBackFromPoll} />
        ) : currentView === 'landing' ? (
          <LandingPage
            onGetStarted={() => {
              if (user) setCurrentView('create');
              else openAuth('register');
            }}
            onExplorePricing={() => setCurrentView('pricing')}
          />
        ) : currentView === 'dashboard' ? (
          <DashboardPage
            onCreatePoll={() => setCurrentView('create')}
            onOpenPoll={handleOpenPoll}
          />
        ) : currentView === 'create' ? (
          <CreatePollPage
            onPollCreated={(code) => handleOpenPoll(code)}
            onCancel={() => setCurrentView('dashboard')}
          />
        ) : (
          <PricingPage
            onSelectFree={() => {
              if (!user) openAuth('register');
              else setCurrentView('dashboard');
            }}
            onUpgrade={() => {}}
          />
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSwitchMode={(mode) => setAuthMode(mode)}
        onSuccess={() => {
          if (!activePollCode) setCurrentView('dashboard');
        }}
      />

      <UpgradeModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
