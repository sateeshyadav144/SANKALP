import React, { useEffect, useState } from 'react';
import {
  Wallet,
  CalendarCheck,
  Sparkles,
  GitGraph,
  Layers,
  Volume2,
  Code2,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  BookOpen,
  Clock,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { OverallDashboardStats } from '../types';
import { CampusCanvas } from '../components/3d/CampusCanvas';
import { MODULE_LIST } from '../components/layout/Sidebar';

interface DashboardOverviewProps {
  onSelectModule: (moduleId: string) => void;
  onOpenConfig: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectModule,
  onOpenConfig,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverallDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      if (!user) return;
      try {
        const data = await apiService.getDashboardStats(user.id);
        if (isMounted) setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Personalized Greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome Banner with Student Details */}
      <div className="rounded-2xl glass-panel border border-cyan-500/20 p-5 sm:p-6 bg-gradient-to-r from-slate-900/90 via-[#0b1426]/80 to-[#101b36]/90 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>{user?.department || 'Computer Science & Engineering'}</span>
              <span>•</span>
              <span>{user?.semester || '6th Semester'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {getGreeting()}, <span className="text-gradient-cyan">{user?.full_name}</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Academic semester overview, module telemetry, and student productivity tools.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectModule('attendance')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => onSelectModule('expenses')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log Expense</span>
            </button>
            <button
              onClick={() => onSelectModule('summarizer')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D Campus Mesh Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Campus Module Mesh</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Interactive 3D Visualizer
          </span>
        </div>
        <CampusCanvas onNodeSelect={(id) => onSelectModule(id)} height="h-[240px] sm:h-[260px]" />
      </div>

      {/* Dynamic Key Performance Metrics (Real calculated DB queries) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Budget */}
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Monthly Budget
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              ₹{stats ? stats.monthlyExpenditure.toLocaleString('en-IN') : '...'}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1">
                / ₹{stats ? stats.monthlyBudget.toLocaleString('en-IN') : '5,000'}
              </span>
            </div>
            {/* Budget Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (stats?.budgetUtilizationPct || 0) > 85 ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${stats ? stats.budgetUtilizationPct : 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
              <span>{stats?.budgetUtilizationPct || 0}% Utilized</span>
              <span>
                ₹{stats ? Math.max(0, stats.monthlyBudget - stats.monthlyExpenditure).toLocaleString('en-IN') : 0} Left
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Attendance Tracking */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              Overall Attendance
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {stats ? `${stats.overallAttendancePct}%` : '...'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {(stats?.lowAttendanceCount || 0) > 0 ? (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{stats?.lowAttendanceCount} subject below target</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Above 75% across all courses</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Tracking {stats?.totalSubjects || 5} Enrolled Subjects
            </p>
          </div>
        </div>

        {/* Metric 3: Study Notes & Summaries */}
        <div className="p-5 rounded-2xl glass-panel border border-violet-500/20 relative overflow-hidden group hover:border-violet-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">
              AI Study Synthesizer
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {stats?.totalNotes || 0}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">
                Saved Notes
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-violet-300">
              <span>NLP Extractive & Keypoints</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              {stats?.totalDiagrams || 0} Visual Mermaid Diagrams
            </p>
          </div>
        </div>

        {/* Metric 4: Flashcards & Retention */}
        <div className="p-5 rounded-2xl glass-panel border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
              Spaced Repetition
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {stats?.totalFlashcards || 0}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">
                Flashcards
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-300">
              <span>Interactive 3D Flip Review</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              {stats?.totalSnippets || 0} Code Snippets Saved
            </p>
          </div>
        </div>
      </div>

      {/* The 8 Module Cards Grid */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Smart Campus Modules
          </h2>
          <p className="text-xs text-slate-400">
            Select a module to view records, perform operations, and access tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MODULE_LIST.filter((m) => m.id !== 'dashboard').map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onSelectModule(mod.id)}
                className="group p-4 rounded-xl glass-panel border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`p-2 rounded-lg ${mod.color} bg-slate-900/80 border border-slate-800`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                    {mod.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    {mod.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-slate-400 group-hover:text-cyan-300 transition">
                  <span>Open Module</span>
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
