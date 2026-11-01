import React, { useState, useEffect } from 'react';
import { X, Database, Check, Copy, ShieldCheck, Link2, Lock, Server } from 'lucide-react';
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

export const SupabaseConfigModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copiedMigration, setCopiedMigration] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState(
    supabaseUrl || localStorage.getItem('sankalp_supabase_url') || ''
  );
  const [anonKey, setAnonKey] = useState(
    supabaseAnonKey || localStorage.getItem('sankalp_supabase_anon_key') || ''
  );
  const [connectSaved, setConnectSaved] = useState(false);

  // Proactively purge any legacy client-stored Gemini keys for strict security
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sankalp_gemini_api_key');
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl.trim() || !anonKey.trim()) return;

    let formattedUrl = projectUrl.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    if (!formattedUrl.includes('.supabase.co') && !formattedUrl.includes('localhost')) {
      formattedUrl = `${formattedUrl}.supabase.co`;
    }

    localStorage.setItem('sankalp_supabase_url', formattedUrl);
    localStorage.setItem('sankalp_supabase_anon_key', anonKey.trim());
    setConnectSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedMigration(path);
    setTimeout(() => setCopiedMigration(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#061329] border border-[#17365C] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#17365C]">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#00D9FF]" />
            <h2 className="text-base font-bold text-[#F4F7FF]">Database & Security Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9BAFCB] hover:text-white hover:bg-[#071B35] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="mt-4 p-4 rounded-xl bg-[#071B35] border border-[#17365C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-[#00D6B5]/20 text-[#00D6B5]' : 'bg-[#0B2144] text-[#9BAFCB]'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F4F7FF]">
                {isSupabaseConfigured ? 'Supabase Database Connected' : 'Local Storage Workspace Active'}
              </p>
              <p className="text-[11px] text-[#9BAFCB]">
                {isSupabaseConfigured
                  ? `Connected to ${supabaseUrl}`
                  : 'Configure project credentials below to synchronize data with Row Level Security (RLS).'}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${isSupabaseConfigured ? 'bg-[#00D6B5]/20 text-[#00D6B5] border border-[#00D6B5]/30' : 'bg-[#0B2144] text-[#9BAFCB] border border-[#17365C]'}`}>
            {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL MODE'}
          </span>
        </div>

        {/* Direct Connect Form */}
        <form onSubmit={handleSaveCredentials} className="mt-5 p-4 rounded-xl bg-[#071B35] border border-[#00D9FF]/30 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#00D9FF]" />
            <h3 className="text-xs font-bold text-[#F4F7FF]">Connect to Supabase Project</h3>
          </div>
          <p className="text-[11px] text-[#9BAFCB]">
            Provide your project URL and public Anon Key (from Supabase Dashboard &gt; Project Settings &gt; API).
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono text-[#9BAFCB] mb-1">
                PROJECT URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#061329] border border-[#17365C] text-[#F4F7FF] text-xs font-mono focus:border-[#00D9FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9BAFCB] mb-1">
                PUBLISHABLE / ANON KEY (Client-Safe)
              </label>
              <input
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#061329] border border-[#17365C] text-[#F4F7FF] text-xs font-mono focus:border-[#00D9FF] outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[#9BAFCB]/70 font-mono">
                Never enter your service_role secret key here.
              </span>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#087BFF] to-[#00D9FF] text-white transition flex items-center gap-1.5 shadow-md"
              >
                {connectSaved ? <Check className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{connectSaved ? 'Saved! Reloading...' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Database Migration Instructions */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00D9FF] font-mono flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            <span>Database Migrations & Security Hardening</span>
          </h3>

          <div className="space-y-2 text-xs text-[#9BAFCB]">
            <div className="p-3 rounded-xl bg-[#071B35] border border-[#17365C] space-y-2">
              <p className="text-[11px] text-[#9BAFCB]">
                Execute the migrations in your Supabase <strong>SQL Editor</strong> to enable Row Level Security (RLS), student data isolation, and rate-limiting:
              </p>
              
              {[
                { name: '1. Initial Campus Schema', path: 'supabase/migrations/20261029000000_sankalp_schema.sql' },
                { name: '2. Attendance Enhancements', path: 'supabase/migrations/20261031000000_attendance_enhancement.sql' },
                { name: '3. Flashcard Decks & Spaced Review', path: 'supabase/migrations/20261031000001_flashcards_decks.sql' },
                { name: '4. Security Hardening & Rate Limiter', path: 'supabase/migrations/20261031000002_security_hardening.sql' },
              ].map((m) => (
                <div key={m.path} className="flex items-center justify-between p-2 rounded-lg bg-[#061329] border border-[#17365C] font-mono text-[11px]">
                  <div>
                    <span className="text-[#F4F7FF] font-medium block">{m.name}</span>
                    <span className="text-[10px] text-[#9BAFCB]">{m.path}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyPath(m.path)}
                    className="flex items-center gap-1 text-[10px] text-[#9BAFCB] hover:text-[#00D9FF] px-2 py-1 rounded bg-[#071B35] transition"
                  >
                    {copiedMigration === m.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMigration === m.path ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Backend Architecture Note */}
          <div className="mt-4 p-3.5 rounded-xl bg-[#030E1F] border border-[#087BFF]/30 space-y-1.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00D9FF]" />
              <h4 className="text-xs font-bold text-[#F4F7FF]">Server-Side Secret Architecture (Phase 2 & 5)</h4>
            </div>
            <p className="text-[11px] text-[#9BAFCB] leading-relaxed">
              In accordance with enterprise security standards, private AI credentials (<code className="text-[#00D9FF]">GEMINI_API_KEY</code>) are kept strictly on the backend. When deployed, the Supabase Edge Function (<code className="text-[#00D9FF]">supabase/functions/gemini-proxy</code>) manages model invocation with database-backed token rate limits.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#17365C] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-[#071B35] hover:bg-[#0B2144] border border-[#17365C] text-[#F4F7FF] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
