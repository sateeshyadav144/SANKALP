import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  CalendarCheck,
  Sparkles,
  GitGraph,
  Layers,
  Volume2,
  Code2,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  accentBg: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
}

export const MODULE_LIST: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    icon: LayoutDashboard,
    color: 'text-cyan-400',
    accentBg: 'group-hover:bg-cyan-500/10',
    desc: 'Campus telemetry & key metrics',
  },
  {
    id: 'expenses',
    name: 'Expense Tracker',
    icon: Wallet,
    color: 'text-emerald-400',
    accentBg: 'group-hover:bg-emerald-500/10',
    desc: 'Monthly budgets & expenditure log',
  },
  {
    id: 'attendance',
    name: 'Attendance Manager',
    icon: CalendarCheck,
    color: 'text-cyan-400',
    accentBg: 'group-hover:bg-cyan-500/10',
    desc: 'Course logs & threshold alerts',
  },
  {
    id: 'summarizer',
    name: 'AI Note Summarizer',
    icon: Sparkles,
    color: 'text-violet-400',
    accentBg: 'group-hover:bg-violet-500/10',
    desc: 'Lecture notes & key point extraction',
  },
  {
    id: 'visuals',
    name: 'Notes & Visuals',
    icon: GitGraph,
    color: 'text-sky-400',
    accentBg: 'group-hover:bg-sky-500/10',
    desc: 'Interactive Mermaid diagrams & architecture',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: Layers,
    color: 'text-purple-400',
    accentBg: 'group-hover:bg-purple-500/10',
    desc: 'Spaced repetition & study mode',
  },
  {
    id: 'tts',
    name: 'Text-to-Speech',
    icon: Volume2,
    color: 'text-amber-400',
    accentBg: 'group-hover:bg-amber-500/10',
    desc: 'Speech synthesis for study materials',
  },
  {
    id: 'code',
    name: 'Code Editor',
    icon: Code2,
    color: 'text-blue-400',
    accentBg: 'group-hover:bg-blue-500/10',
    desc: 'Monaco code editor & test environment',
  },
  {
    id: 'safety',
    name: 'Safety & Welfare',
    icon: ShieldAlert,
    color: 'text-rose-400',
    accentBg: 'group-hover:bg-rose-500/10',
    desc: 'Emergency contacts & campus assistance',
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 flex-shrink-0 flex-col border-r border-cyan-500/15 bg-[#070b14]/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'
        }`}
      >
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>

          {MODULE_LIST.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                  setMobileMenuOpen?.(false);
                }}
                className={`group relative w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-all ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300' : `${item.color} bg-slate-900/60`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-cyan-300 font-semibold' : ''}`}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
