import React, { useMemo } from 'react';
import {
  Calendar,
  Wallet,
  CalendarCheck,
  Brain,
  FolderGit2,
  Layers,
  AudioLines,
  Code2,
  ShieldAlert,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import campusGateImg from '../assets/campus_gate.jpg';

interface DashboardOverviewProps {
  onSelectModule: (moduleId: string) => void;
  onOpenConfig?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectModule,
}) => {
  const { user } = useAuth();

  // Proper Title-Cased Student Name (e.g. "Sateesh Yadav" instead of "sateesh yadav")
  const formattedStudentName = useMemo(() => {
    if (!user?.full_name) return 'Student';
    return user.full_name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, [user?.full_name]);

  // Dynamic Greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  // Formatted Current Date: e.g. "29 Oct 2026 | Thursday"
  const formattedDate = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString('en-GB', { day: '2-digit' });
    const month = now.toLocaleDateString('en-GB', { month: 'short' });
    const year = now.getFullYear();
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${day} ${month} ${year} | ${weekday}`;
  }, []);

  // 8 Specific Module Cards exactly from reference design
  const moduleCards = [
    {
      id: 'expenses',
      name: 'Expense Tracker',
      desc: 'Track your expenses & budget',
      icon: Wallet,
      accent: '#00D6B5',
      iconBg: 'bg-[#00D6B5]/15 text-[#00D6B5] border-[#00D6B5]/30',
      btnBg: 'bg-[#00D6B5] text-[#020B1A] hover:bg-[#00D6B5]/90',
      cardBorder: 'hover:border-[#00D6B5]/50 hover:shadow-[0_8px_30px_rgba(0,214,181,0.15)]',
      watermark: (
        <svg className="w-28 h-20 text-[#00D6B5]" viewBox="0 0 120 80" fill="currentColor">
          <rect x="10" y="45" width="12" height="30" rx="3" opacity="0.4" />
          <rect x="28" y="30" width="12" height="45" rx="3" opacity="0.6" />
          <rect x="46" y="15" width="12" height="60" rx="3" opacity="0.8" />
          <rect x="64" y="38" width="12" height="37" rx="3" opacity="0.5" />
          <rect x="82" y="20" width="12" height="55" rx="3" opacity="0.9" />
          <rect x="100" y="8" width="12" height="67" rx="3" opacity="1.0" />
        </svg>
      ),
    },
    {
      id: 'attendance',
      name: 'Attendance',
      desc: 'Mark and manage your attendance',
      icon: CalendarCheck,
      accent: '#087BFF',
      iconBg: 'bg-[#087BFF]/15 text-[#087BFF] border-[#087BFF]/30',
      btnBg: 'bg-[#087BFF] text-white hover:bg-[#087BFF]/90',
      cardBorder: 'hover:border-[#087BFF]/50 hover:shadow-[0_8px_30px_rgba(8,123,255,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#087BFF]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <rect x="10" y="15" width="80" height="65" rx="10" strokeWidth="4" />
          <line x1="10" y1="35" x2="90" y2="35" strokeWidth="3" />
          <line x1="28" y1="8" x2="28" y2="20" strokeWidth="5" strokeLinecap="round" />
          <line x1="72" y1="8" x2="72" y2="20" strokeWidth="5" strokeLinecap="round" />
          <circle cx="30" cy="52" r="4" fill="currentColor" />
          <circle cx="50" cy="52" r="4" fill="currentColor" />
          <circle cx="70" cy="52" r="4" fill="currentColor" />
          <circle cx="30" cy="68" r="4" fill="currentColor" />
          <path d="M46 68 L50 72 L62 60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'summarizer',
      name: 'AI Notes',
      desc: 'Summarize your study notes',
      icon: Brain,
      accent: '#713CFF',
      iconBg: 'bg-[#713CFF]/15 text-[#A78BFA] border-[#713CFF]/30',
      btnBg: 'bg-[#713CFF] text-white hover:bg-[#713CFF]/90',
      cardBorder: 'hover:border-[#713CFF]/50 hover:shadow-[0_8px_30px_rgba(113,60,255,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#713CFF]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <rect x="15" y="10" width="60" height="75" rx="8" strokeWidth="4" />
          <line x1="26" y1="26" x2="64" y2="26" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="38" x2="58" y2="38" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="50" x2="64" y2="50" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="62" x2="48" y2="62" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 75 L85 45 L90 50 L65 80 Z" fill="currentColor" opacity="0.6" />
        </svg>
      ),
    },
    {
      id: 'visuals',
      name: 'Notes & Visuals',
      desc: 'Create notes and diagrams',
      icon: FolderGit2,
      accent: '#F59E0B',
      iconBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
      btnBg: 'bg-[#F59E0B] text-[#020B1A] hover:bg-[#F59E0B]/90',
      cardBorder: 'hover:border-[#F59E0B]/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#F59E0B]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <circle cx="25" cy="30" r="12" strokeWidth="3" />
          <circle cx="75" cy="30" r="12" strokeWidth="3" />
          <circle cx="50" cy="70" r="14" strokeWidth="3" fill="currentColor" fillOpacity="0.2" />
          <line x1="36" y1="35" x2="64" y2="35" strokeWidth="3" strokeDasharray="3 3" />
          <line x1="32" y1="40" x2="43" y2="60" strokeWidth="3" />
          <line x1="68" y1="40" x2="57" y2="60" strokeWidth="3" />
        </svg>
      ),
    },
    {
      id: 'flashcards',
      name: 'Flashcards',
      desc: 'Learn with smart flashcards',
      icon: Layers,
      accent: '#F02E91',
      iconBg: 'bg-[#F02E91]/15 text-[#F02E91] border-[#F02E91]/30',
      btnBg: 'bg-[#F02E91] text-white hover:bg-[#F02E91]/90',
      cardBorder: 'hover:border-[#F02E91]/50 hover:shadow-[0_8px_30px_rgba(240,46,145,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#F02E91]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <rect x="25" y="8" width="55" height="40" rx="6" strokeWidth="3" opacity="0.3" />
          <rect x="20" y="18" width="60" height="42" rx="6" strokeWidth="3" opacity="0.6" />
          <rect x="15" y="28" width="65" height="46" rx="6" strokeWidth="3.5" fill="currentColor" fillOpacity="0.15" />
          <line x1="25" y1="42" x2="55" y2="42" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="52" x2="68" y2="52" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'tts',
      name: 'Text-to-Speech',
      desc: 'Listen to your notes',
      icon: AudioLines,
      accent: '#00D9FF',
      iconBg: 'bg-[#00D9FF]/15 text-[#00D9FF] border-[#00D9FF]/30',
      btnBg: 'bg-[#00D9FF] text-[#020B1A] hover:bg-[#00D9FF]/90',
      cardBorder: 'hover:border-[#00D9FF]/50 hover:shadow-[0_8px_30px_rgba(0,217,255,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#00D9FF]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <path d="M20 50 A 30 30 0 0 1 80 50" strokeWidth="4" strokeLinecap="round" />
          <rect x="12" y="45" width="14" height="26" rx="6" strokeWidth="3" fill="currentColor" fillOpacity="0.3" />
          <rect x="74" y="45" width="14" height="26" rx="6" strokeWidth="3" fill="currentColor" fillOpacity="0.3" />
          <line x1="38" y1="52" x2="38" y2="64" strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="46" x2="46" y2="70" strokeWidth="3" strokeLinecap="round" />
          <line x1="54" y1="42" x2="54" y2="74" strokeWidth="3" strokeLinecap="round" />
          <line x1="62" y1="50" x2="62" y2="66" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'code',
      name: 'Code Editor',
      desc: 'Write, run and learn code',
      icon: Code2,
      accent: '#6366F1',
      iconBg: 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30',
      btnBg: 'bg-[#6366F1] text-white hover:bg-[#6366F1]/90',
      cardBorder: 'hover:border-[#6366F1]/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#6366F1]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <rect x="10" y="15" width="80" height="60" rx="8" strokeWidth="3.5" />
          <line x1="10" y1="30" x2="90" y2="30" strokeWidth="2.5" />
          <circle cx="20" cy="22" r="2.5" fill="currentColor" />
          <circle cx="28" cy="22" r="2.5" fill="currentColor" />
          <circle cx="36" cy="22" r="2.5" fill="currentColor" />
          <path d="M30 45 L22 53 L30 61" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 45 L58 53 L50 61" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="42" y1="43" x2="38" y2="63" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'safety',
      name: 'Safety & Welfare',
      desc: 'Support & emergency resources',
      icon: ShieldAlert,
      accent: '#F04356',
      iconBg: 'bg-[#F04356]/15 text-[#F04356] border-[#F04356]/30',
      btnBg: 'bg-[#F04356] text-white hover:bg-[#F04356]/90',
      cardBorder: 'hover:border-[#F04356]/50 hover:shadow-[0_8px_30px_rgba(240,67,86,0.15)]',
      watermark: (
        <svg className="w-28 h-24 text-[#F04356]" viewBox="0 0 100 90" fill="none" stroke="currentColor">
          <path
            d="M50 12 L80 24 V50 C80 68 50 82 50 82 C50 82 20 68 20 50 V24 Z"
            strokeWidth="3.5"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <line x1="50" y1="36" x2="50" y2="56" strokeWidth="4" strokeLinecap="round" />
          <line x1="40" y1="46" x2="60" y2="46" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Welcome Hero Section matching the Reference Design */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#071B35] via-[#081F3D] to-[#041126] border border-[#17365C] overflow-hidden shadow-2xl">
        {/* Background subtle radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00D9FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-stretch justify-between relative z-10">
          {/* Left Text & Date Badge */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between max-w-xl z-20">
            {/* Top Cyan Accent Line */}
            <div className="w-12 h-1 bg-[#00D9FF] rounded-full mb-6" />

            <div className="space-y-2">
              <p className="text-base sm:text-lg font-medium text-[#9BAFCB]">
                {greeting}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F4F7FF] tracking-tight leading-tight">
                Welcome Back, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#087BFF] to-[#713CFF]">
                  {formattedStudentName}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#9BAFCB] pt-1 max-w-md">
                Your smart campus companion for a better tomorrow.
              </p>
            </div>

            {/* Dynamic Date Pill Badge */}
            <div className="mt-8 pt-2">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#061830]/90 border border-[#17365C] text-xs sm:text-sm font-medium text-[#F4F7FF] shadow-inner">
                <Calendar className="w-4 h-4 text-[#00D9FF]" />
                <span className="tracking-wide">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right: Actual Campus Gate Photograph Frame */}
          <div className="relative flex-1 min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] p-4 lg:p-6 flex items-center justify-center">
            <div className="relative w-full h-full min-h-[260px] sm:min-h-[300px] rounded-2xl overflow-hidden border border-[#17365C] shadow-[0_8px_30px_rgba(0,0,0,0.5)] bg-[#030E1F]/80 group">
              {/* Campus Gate Photo */}
              <img
                src={campusGateImg}
                alt="Buddha Group of Institutions - Bodhi Gate"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Subtle gradient vignette to blend seamlessly with theme */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020B1A]/80 via-transparent to-transparent pointer-events-none" />

              {/* Bottom Subtle Location Badge */}
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#020B1A]/85 backdrop-blur-md border border-[#17365C] text-xs font-medium text-[#F4F7FF] shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span className="tracking-wide text-xs">Buddha Group of Institutions • Bodhi Gate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Modules Section Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#00D9FF] rounded-full shadow-[0_0_10px_#00D9FF]" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
              Modules
            </h2>
            <p className="text-xs sm:text-sm text-[#9BAFCB]">
              Everything you need, in one place.
            </p>
          </div>
        </div>

        {/* Exactly 8 Module Cards Grid: 4 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {moduleCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onSelectModule(card.id)}
                className={`group relative rounded-2xl bg-[#071B35] border border-[#17365C] p-5 h-[180px] flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${card.cardBorder}`}
              >
                {/* Watermark Graphic in Background */}
                <div className="absolute -right-1 -bottom-1 pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-300">
                  {card.watermark}
                </div>

                {/* Top: Icon */}
                <div className="relative z-10">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${card.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Bottom: Module Info & Circular Arrow Button */}
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#F4F7FF] group-hover:text-white transition tracking-tight truncate">
                      {card.name}
                    </h3>
                    <p className="text-xs text-[#9BAFCB] mt-0.5 line-clamp-1">
                      {card.desc}
                    </p>
                  </div>

                  {/* Circular Action Arrow Button */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-md ${card.btnBg}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
