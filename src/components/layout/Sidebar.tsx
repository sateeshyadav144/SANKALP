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
    desc: 'Campus 3D telemetry & summary',
  },
  {
    id: 'expenses',
    name: 'Expense Tracker',
    icon: Wallet,
    color: 'text-emerald-400',
    accentBg: 'group-hover:bg-emerald-500/10',
    badge: 'Budget',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    desc: 'Expenditure, category split & budget',
  },
  {
    id: 'attendance',
    name: 'Attendance Manager',
    icon: CalendarCheck,
    color: 'text-cyan-400',
    accentBg: 'group-hover:bg-cyan-500/10',
    badge: '75% Target',
    badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    desc: 'Subject logs & percentage alerts',
  },
  {
    id: 'summarizer',
    name: 'AI Note Summarizer',
    icon: Sparkles,
    color: 'text-violet-400',
    accentBg: 'group-hover:bg-violet-500/10',
    badge: 'AI Engine',
    badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    desc: 'Text/doc summarization & key points',
  },
  {
    id: 'visuals',
    name: 'Notes & Visuals',
    icon: GitGraph,
    color: 'text-sky-400',
    accentBg: 'group-hover:bg-sky-500/10',
    badge: 'Mermaid',
    badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    desc: 'Flowcharts, architecture & notes',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: Layers,
    color: 'text-purple-400',
    accentBg: 'group-hover:bg-purple-500/10',
    badge: '3D Flip',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    desc: 'Spaced repetition & study mode',
  },
  {
    id: 'tts',
    name: 'Text-to-Speech',
    icon: Volume2,
    color: 'text-amber-400',
    accentBg: 'group-hover:bg-amber-500/10',
    badge: 'Audio',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    desc: 'Read notes aloud with pitch/rate',
  },
  {
    id: 'code',
    name: 'Code Editor',
    icon: Code2,
    color: 'text-blue-400',
    accentBg: 'group-hover:bg-blue-500/10',
    badge: 'Monaco',
    badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    desc: 'Multi-language editor & sandbox runner',
  },
  {
    id: 'safety',
    name: 'Safety & Welfare',
    icon: ShieldAlert,
    color: 'text-rose-400',
    accentBg: 'group-hover:bg-rose-500/10',
    badge: '24/7 SOS',
    badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    desc: 'Campus emergency & health support',
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
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 flex-shrink-0 flex-col border-r border-cyan-500/15 bg-[#070b14]/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-2 text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            Campus Navigation
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
                className={`group relative w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-white border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      isActive ? 'bg-cyan-500/20 shadow-glow-cyan text-cyan-300' : `${item.color} bg-slate-900/60`
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

                {item.badge && (
                  <span
                    className={`hidden sm:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px]">
            <div className="flex items-center justify-between font-mono text-cyan-300 font-semibold">
              <span>SANKALP v2.0</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-slate-400 mt-1 text-[10px] leading-relaxed">
              Unified 3D smart campus ecosystem designed for student excellence.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
