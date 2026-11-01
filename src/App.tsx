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
import { LoadingScreen } from './components/common/LoadingScreen';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Premium Loading Screen while initializing authentication session & telemetry
  if (loading) {
    return <LoadingScreen onRetry={() => window.location.reload()} />;
  }

  // Not authenticated: Show Login & Registration Page
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated: Render Main Application Shell
  return (
    <div className="min-h-screen bg-[#020B1A] text-[#F4F7FF] flex font-sans selection:bg-[#00D9FF]/30 selection:text-[#00D9FF]">
      {/* Sidebar on the Left */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area on the Right */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1550px] mx-auto pb-10">
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

            {/* Clean Campus Footer */}
            <footer className="mt-14 pt-6 border-t border-[#17365C]/60 text-center text-xs text-[#9BAFCB]">
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-[#9BAFCB]">
                <span className="font-bold text-[#00D9FF]">SANKALP</span>
                <span>•</span>
                <span>Smart Campus Ecosystem</span>
                <span>•</span>
                <span>All Systems Operational</span>
              </div>
            </footer>
          </div>
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
