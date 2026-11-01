import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  LogOut,
  User,
  ChevronDown,
  X,
  Menu,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusNotification } from '../../types';
import { MODULE_NAV_ITEMS } from './Sidebar';

interface HeaderProps {
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  onOpenProfile: () => void;
  onOpenConfig: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const INITIAL_NOTIFICATIONS: CampusNotification[] = [
  {
    id: 'notif_1',
    title: 'Low Attendance Alert',
    message: 'Attendance in Algorithms & Data Structures is currently below 75%.',
    type: 'warning',
    timestamp: '15m ago',
    read: false,
    moduleLink: 'attendance',
  },
  {
    id: 'notif_2',
    title: 'Monthly Budget Milestone',
    message: 'You have utilized 62% of your monthly expense budget.',
    type: 'info',
    timestamp: '2h ago',
    read: false,
    moduleLink: 'expenses',
  },
  {
    id: 'notif_3',
    title: 'Flashcard Review Due',
    message: '4 cards are ready for spaced-repetition review in Operating Systems.',
    type: 'info',
    timestamp: '1d ago',
    read: false,
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
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<CampusNotification[]>(INITIAL_NOTIFICATIONS);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Working Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // Filter modules based on search query
  const filteredModules = MODULE_NAV_ITEMS.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-[#020B1A]/90 backdrop-blur-md border-b border-[#17365C]/70">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#9BAFCB] hover:text-[#00D9FF] hover:bg-[#071B35] transition"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search Input Container */}
          <div className="relative w-full">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#9BAFCB] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search modules, notes, topics..."
                className="w-full h-10 pl-10 pr-20 rounded-full bg-[#071B35]/80 hover:bg-[#071B35] focus:bg-[#071B35] border border-[#17365C] focus:border-[#00D9FF]/70 text-xs sm:text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/70 outline-none transition duration-150"
              />
              <div className="absolute right-3 hidden sm:flex items-center gap-1">
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-[#0B2144] border border-[#17365C] text-[#9BAFCB]">
                  Ctrl + K
                </kbd>
              </div>
            </div>

            {/* Quick-Jump Search Results Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-12 left-0 w-full rounded-2xl bg-[#061329] border border-[#17365C] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#9BAFCB]/70 flex items-center justify-between">
                  <span>Modules & Topics</span>
                  <button
                    onClick={() => {
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="text-[#9BAFCB] hover:text-white"
                  >
                    Esc
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 mt-1">
                  {filteredModules.length > 0 ? (
                    filteredModules.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectModule(item.id);
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#071B35] transition text-xs group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-[#0B2144] text-[#00D9FF]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-[#F4F7FF] group-hover:text-[#00D9FF] transition">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#9BAFCB]">{item.desc}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#9BAFCB] group-hover:text-[#00D9FF] transform group-hover:translate-x-0.5 transition" />
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-[#9BAFCB]">
                      No matching modules found for "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Navigation Controls: Notification & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-full text-[#9BAFCB] hover:text-[#00D9FF] hover:bg-[#071B35] border border-transparent hover:border-[#17365C] transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#F02E91] text-[10px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_#F02E91]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#061329] border border-[#17365C] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-[#17365C]/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#F4F7FF]">Campus Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F02E91]/20 text-[#F02E91] border border-[#F02E91]/40">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-[#00D9FF] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="divide-y divide-[#17365C]/40 max-h-72 overflow-y-auto mt-2">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.moduleLink) onSelectModule(item.moduleLink);
                        setShowNotifications(false);
                      }}
                      className={`py-3 px-2 rounded-xl cursor-pointer transition ${
                        item.read ? 'hover:bg-[#071B35]/50 opacity-60' : 'bg-[#071B35]/60 hover:bg-[#071B35]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={item.type === 'warning' ? 'text-[#F59E0B]' : 'text-[#00D9FF]'}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-[#9BAFCB]/70 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#9BAFCB] mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Pill Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#071B35] hover:bg-[#0B2144] border border-[#17365C] hover:border-[#00D9FF]/40 transition group"
            >
              {/* Circular Avatar */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#087BFF] to-[#00D9FF] p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full bg-[#061329] rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-[#00D9FF]" />
                </div>
              </div>
              <span className="text-xs font-semibold text-[#F4F7FF] group-hover:text-[#00D9FF] transition">
                {user?.full_name?.split(' ')[0] || 'Student'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9BAFCB] group-hover:text-[#F4F7FF] transition" />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#061329] border border-[#17365C] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2.5 border-b border-[#17365C]/60 mb-1">
                  <p className="text-xs font-bold text-[#F4F7FF]">{user?.full_name || 'Student'}</p>
                  <p className="text-[11px] text-[#9BAFCB] truncate">{user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0B2144] text-[#00D9FF] border border-[#17365C]">
                      {user?.roll_number || '21CS001'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0B2144] text-[#9BAFCB] border border-[#17365C]">
                      {user?.semester || '6th Sem'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onOpenProfile();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-[#9BAFCB] hover:text-[#F4F7FF] hover:bg-[#071B35] transition"
                >
                  <User className="w-4 h-4 text-[#00D9FF]" />
                  <span>Student Profile</span>
                </button>

                <button
                  onClick={() => {
                    onOpenConfig();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-[#9BAFCB] hover:text-[#F4F7FF] hover:bg-[#071B35] transition"
                >
                  <Database className="w-4 h-4 text-[#713CFF]" />
                  <span>Database Setup</span>
                </button>

                <div className="border-t border-[#17365C]/60 my-1" />

                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-[#F04356] hover:bg-[#F04356]/10 transition font-medium"
                >
                  <LogOut className="w-4 h-4 text-[#F04356]" />
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
