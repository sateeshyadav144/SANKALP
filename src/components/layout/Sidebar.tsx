import React from 'react';
import { SankalpLogo } from '../common/SankalpLogo';
import {
  Home,
  Wallet,
  CalendarCheck,
  Brain,
  FolderGit2,
  Layers,
  AudioLines,
  Code2,
  ShieldAlert,
} from 'lucide-react';

export interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  accentColor: string;
  desc: string;
}

export const MODULE_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Home',
    icon: Home,
    accentColor: '#087BFF',
    desc: 'Campus overview & telemetry',
  },
  {
    id: 'expenses',
    name: 'Expense Tracker',
    icon: Wallet,
    accentColor: '#00D6B5',
    desc: 'Track expenses & budget',
  },
  {
    id: 'attendance',
    name: 'Attendance',
    icon: CalendarCheck,
    accentColor: '#087BFF',
    desc: 'Mark and manage attendance',
  },
  {
    id: 'summarizer',
    name: 'AI Notes',
    icon: Brain,
    accentColor: '#713CFF',
    desc: 'Summarize study notes',
  },
  {
    id: 'visuals',
    name: 'Notes & Visuals',
    icon: FolderGit2,
    accentColor: '#F59E0B',
    desc: 'Create notes and diagrams',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: Layers,
    accentColor: '#F02E91',
    desc: 'Learn with smart flashcards',
  },
  {
    id: 'tts',
    name: 'Text-to-Speech',
    icon: AudioLines,
    accentColor: '#00D9FF',
    desc: 'Listen to your notes',
  },
  {
    id: 'code',
    name: 'Code Editor',
    icon: Code2,
    accentColor: '#6366F1',
    desc: 'Write, run and learn code',
  },
  {
    id: 'safety',
    name: 'Safety & Welfare',
    icon: ShieldAlert,
    accentColor: '#F04356',
    desc: 'Support & emergency resources',
  },
];

interface SidebarProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] flex-shrink-0 flex flex-col justify-between border-r border-[#17365C] bg-[#061329] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center px-5 border-b border-[#17365C]/60">
            <button
              onClick={() => {
                onSelectModule('dashboard');
                setMobileMenuOpen?.(false);
              }}
              className="flex items-center gap-3 group text-left w-full"
            >
              {/* Approved SANKALP Emblem Logo */}
              <SankalpLogo size={36} glow={true} />
              <div className="min-w-0">
                <h1 className="font-extrabold tracking-wider text-base text-[#F4F7FF] group-hover:text-[#00D9FF] transition font-sans leading-none">
                  SANKALP
                </h1>
                <p className="text-[11px] text-[#9BAFCB] font-medium tracking-normal mt-1 leading-none">
                  Smart Campus Ecosystem
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
            {MODULE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectModule(item.id);
                    setMobileMenuOpen?.(false);
                  }}
                  className={`group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#087BFF] to-[#713CFF] text-white shadow-[0_0_20px_rgba(8,123,255,0.4)] font-medium'
                      : 'text-[#9BAFCB] hover:text-[#F4F7FF] hover:bg-[#071B35]/70'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-[#9BAFCB] group-hover:text-[#00D9FF]'
                    }`}
                  />
                  <span className="text-[13px] font-medium tracking-tight truncate">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Subtle Neon Wave & Version Tag */}
        <div className="relative p-4 border-t border-[#17365C]/60 overflow-hidden">
          {/* Subtle Glowing Wave SVG Graphic at Bottom-Left */}
          <div className="absolute -bottom-4 -left-6 pointer-events-none opacity-40">
            <svg width="180" height="80" viewBox="0 0 180 80" fill="none">
              <path
                d="M-20 60 C 20 40, 60 80, 100 50 C 140 20, 180 60, 200 40"
                stroke="url(#waveGrad1)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M-20 70 C 30 50, 70 85, 120 55 C 160 35, 190 70, 210 50"
                stroke="url(#waveGrad2)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="60%" stopColor="#087BFF" />
                  <stop offset="100%" stopColor="#713CFF" />
                </linearGradient>
                <linearGradient id="waveGrad2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#087BFF" />
                  <stop offset="100%" stopColor="#00D9FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F7FF]">
              <span>SANKALP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D6B5] shadow-[0_0_8px_#00D6B5]" />
            </div>
            <span className="text-[11px] text-[#9BAFCB]/70 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
