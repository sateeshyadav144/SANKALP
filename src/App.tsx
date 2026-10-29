import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './pages/DashboardOverview';
import { ExpenseTracker } from './modules/expenses/ExpenseTracker';
import { AttendanceManager } from './modules/attendance/AttendanceManager';
import { NoteSummarizer } from './modules/summarizer/NoteSummarizer';
import { DiagramStudio } from './modules/visuals/DiagramStudio';
import { FlashcardDeck } from './modules/flashcards/FlashcardDeck';
import { SpeechReader } from './modules/text-to-speech/SpeechReader';
import { CodeStudio } from './modules/code-editor/CodeStudio';
import { SafetyWelfare } from './modules/safety/SafetyWelfare';
import { ProfileModal } from './components/layout/ProfileModal';
import { SupabaseConfigModal } from './components/layout/SupabaseConfigModal';
import { Database, AlertCircle, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading, isSupabaseConnected } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Global loading spinner while initializing session
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#070b14] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 animate-spin opacity-70 blur-md" />
          <div className="relative w-full h-full bg-[#070b14] rounded-2xl border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xl text-cyan-400">
            S
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white tracking-widest font-mono">SANKALP</p>
          <p className="text-xs text-slate-400 mt-1">Initializing Secure Smart Campus Session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Login & Registration Page
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated: Render Main Application Shell
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Main Top Header */}
      <Header
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* App Body: Sidebar + Dynamic Module Workspace */}
      <div className="flex-1 flex w-full max-w-[1700px] mx-auto">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeModule === 'dashboard' && (
            <DashboardOverview
              onSelectModule={setActiveModule}
              onOpenConfig={() => setIsConfigModalOpen(true)}
            />
          )}
          {activeModule === 'expenses' && <ExpenseTracker />}
          {activeModule === 'attendance' && <AttendanceManager />}
          {activeModule === 'summarizer' && <NoteSummarizer />}
          {activeModule === 'visuals' && <DiagramStudio />}
          {activeModule === 'flashcards' && <FlashcardDeck />}
          {activeModule === 'tts' && <SpeechReader />}
          {activeModule === 'code' && <CodeStudio />}
          {activeModule === 'safety' && <SafetyWelfare />}

          {/* Clean Footer */}
          <footer className="mt-12 pt-6 pb-6 border-t border-slate-800/60 text-center text-xs text-slate-500">
            <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="font-bold text-cyan-400">SANKALP</span>
              <span>•</span>
              <span>Smart Campus Ecosystem</span>
              <span>•</span>
              <span>College Project</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};
