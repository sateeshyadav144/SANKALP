import React, { useState } from 'react';
import { X, Database, Key, Sparkles, Check, Copy, ExternalLink, ShieldCheck, Link2 } from 'lucide-react';
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

export const SupabaseConfigModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [projectUrl, setProjectUrl] = useState(
    supabaseUrl || localStorage.getItem('sankalp_supabase_url') || ''
  );
  const [anonKey, setAnonKey] = useState(
    supabaseAnonKey ||
      localStorage.getItem('sankalp_supabase_anon_key') ||
      'sb_publishable_vQTFPbXWZItc4u4RMvtCAA_cwVgBtom'
  );
  const [connectSaved, setConnectSaved] = useState(false);

  // Gemini API key state
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('sankalp_gemini_api_key') || ''
  );
  const [keySaved, setKeySaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl.trim()) return;

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

  const handleSaveApiKey = () => {
    localStorage.setItem('sankalp_gemini_api_key', apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const copyMigrationPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20261029000000_sankalp_schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Supabase & Database Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isSupabaseConfigured ? 'Supabase Database Connected' : 'Local Storage Workspace Active'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isSupabaseConfigured
                  ? `Connected to ${supabaseUrl}`
                  : 'Enter your Project URL below to sync your campus data directly to Supabase.'}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
            {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL MODE'}
          </span>
        </div>

        {/* Direct Connect Form */}
        <form onSubmit={handleSaveCredentials} className="mt-5 p-4 rounded-xl bg-slate-900/50 border border-cyan-500/25 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Direct Supabase Connection
            </h3>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              required
              placeholder="https://xyzabcdefg.supabase.co (or your project ID)"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Found in your Supabase dashboard URL: <code className="text-cyan-300">https://supabase.com/dashboard/project/&lt;project-id&gt;</code>
            </p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Publishable / Anon API Key
            </label>
            <input
              type="text"
              required
              placeholder="sb_publishable_... or eyJhbGci..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white shadow-glow-cyan transition flex items-center gap-1.5"
            >
              {connectSaved ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              <span>{connectSaved ? 'Connecting...' : 'Connect Supabase'}</span>
            </button>
          </div>
        </form>

        {/* Step-by-step setup guide */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            How to run the SQL Migration in Supabase:
          </h3>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="font-semibold text-slate-100 block mb-1">1. Open the SQL Editor</span>
              <p className="text-slate-400">
                In your Supabase project dashboard, click on the <strong>SQL Editor</strong> tab on the left.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="font-semibold text-slate-100 block mb-1">2. Run the Migration SQL</span>
              <p className="text-slate-400">
                Copy the contents of <code className="text-cyan-300">supabase/migrations/20261029000000_sankalp_schema.sql</code>, paste it into the SQL Editor, and click <strong>Run</strong>.
              </p>
              <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-black/50 border border-slate-800 font-mono text-[11px] text-cyan-300">
                <span>supabase/migrations/20261029000000_sankalp_schema.sql</span>
                <button
                  type="button"
                  onClick={copyMigrationPath}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Path'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional AI Key */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-bold text-slate-200">Optional: Gemini AI Key for Note Summarizer</h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              SANKALP already includes a built-in extractive heuristic summarizer that works offline. If you want live Google Gemini models:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="AIzaSy... (Gemini API Key)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3.5 py-1.5 text-xs font-medium rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5"
              >
                {keySaved ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                <span>{keySaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
