import React, { useState } from 'react';
import {
  Bell,
  Search,
  LogOut,
  User,
  ShieldCheck,
  Database,
  Sliders,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusNotification } from '../../types';

interface HeaderProps {
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  onOpenProfile: () => void;
  onOpenConfig: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const SAMPLE_NOTIFICATIONS: CampusNotification[] = [
  {
    id: 'notif_1',
    title: 'Low Attendance Alert',
    message: 'Your attendance in Design & Analysis of Algorithms is below 80%. Need 3 consecutive classes to reach target.',
    type: 'warning',
    timestamp: '15m ago',
    read: false,
    moduleLink: 'attendance',
  },
  {
    id: 'notif_2',
    title: 'Monthly Budget Milestone',
    message: 'You have utilized 62% of your monthly expenditure budget.',
    type: 'info',
    timestamp: '2h ago',
    read: false,
    moduleLink: 'expenses',
  },
  {
    id: 'notif_3',
    title: 'Flashcard Review Due',
    message: '4 cards are due for spaced-repetition review in Operating Systems.',
    type: 'info',
    timestamp: '1d ago',
    read: true,
    moduleLink: 'flashcards',
  },
];

export const Header: React.FC<HeaderProps> = ({
  onSelectModule,
  onOpenProfile,
  onOpenConfig,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { user, signOut, isSupabaseConnected } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/15 bg-[#070b14]/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <button
            onClick={() => onSelectModule('dashboard')}
            className="flex items-center gap-3 group text-left"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-violet-600 p-[1.5px] shadow-glow-cyan">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-base">
                  S
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base text-slate-100 group-hover:text-cyan-400 transition font-sans">
                  SANKALP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Smart Campus Ecosystem
              </p>
            </div>
          </button>
        </div>

        {/* Center: Search & Module Quick Jump */}
        <div className="hidden lg:flex items-center max-w-md w-full mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search modules, notes, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-1.5 text-xs rounded-xl glass-input placeholder:text-slate-500 focus:border-cyan-400 transition"
            />
            <kbd className="absolute right-2.5 top-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              /
            </kbd>
          </div>
        </div>

        {/* Right: Status badge, Notifications, and Profile */}
        <div className="flex items-center gap-3">
          {/* Supabase status indicator badge */}
          <button
            onClick={onOpenConfig}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
              isSupabaseConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-500/30'
            }`}
            title={isSupabaseConnected ? 'Connected to Supabase Database' : 'Local Storage Mode (Click to configure Supabase)'}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? 'Supabase' : 'Database Setup'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-slate-400'}`} />
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 border border-cyan-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">Campus Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="divide-y divide-slate-800/70 max-h-72 overflow-y-auto mt-2">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.moduleLink) onSelectModule(item.moduleLink);
                        setShowNotifications(false);
                      }}
                      className={`py-3 px-2 rounded-lg cursor-pointer transition ${
                        item.read ? 'hover:bg-slate-800/40 opacity-70' : 'bg-cyan-500/5 hover:bg-cyan-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className={item.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition border border-transparent hover:border-slate-700/50"
            >
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user?.full_name || 'Student Avatar'}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-500/30"
              />
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-slate-200 line-clamp-1">{user?.full_name || 'Student'}</p>
                <p className="text-[10px] text-cyan-400 font-mono">{user?.roll_number || 'CS Undergrad'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl p-2 z-50 border border-cyan-500/20">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-100">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {user?.department || 'Engineering'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onOpenProfile();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Student Profile</span>
                </button>

                <button
                  onClick={() => {
                    onOpenConfig();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition"
                >
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <span>Database & AI Setup</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
