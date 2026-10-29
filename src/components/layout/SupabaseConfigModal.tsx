import React, { useState } from 'react';
import { X, Database, Key, Sparkles, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const SupabaseConfigModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('sankalp_gemini_api_key') || ''
  );
  const [keySaved, setKeySaved] = useState(false);

  if (!isOpen) return null;

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
            <h2 className="text-base font-bold text-slate-100">Database & AI Integration Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isSupabaseConfigured ? 'Supabase Live Connected' : 'Running in Offline / Local Demo Storage'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isSupabaseConfigured
                  ? 'Authenticated PostgreSQL database with active Row Level Security (RLS).'
                  : 'All 8 modules persist seamlessly in browser local storage. Connect Supabase anytime!'}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
            {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL DEMO'}
          </span>
        </div>

        {/* Step-by-step setup guide */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            How to connect your Supabase Cloud Database:
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="font-semibold text-slate-100 block mb-1">1. Create a free Supabase Project</span>
              <p className="text-slate-400">
                Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and create a new project named <code className="text-cyan-300">sankalp-smart-campus</code>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="font-semibold text-slate-100 block mb-1">2. Run the PostgreSQL Migration</span>
              <p className="text-slate-400">
                Open the Supabase <strong>SQL Editor</strong> in your dashboard, copy the contents of the generated migration file, and click <strong>Run</strong>:
              </p>
              <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-black/50 border border-slate-800 font-mono text-[11px] text-cyan-300">
                <span>supabase/migrations/20261029000000_sankalp_schema.sql</span>
                <button
                  onClick={copyMigrationPath}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Path'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="font-semibold text-slate-100 block mb-1">3. Set Environment Variables in `.env`</span>
              <p className="text-slate-400 mb-2">
                In your project root, copy <code className="text-cyan-300">.env.example</code> to <code className="text-cyan-300">.env</code> and fill in your Project URL and Anon Public Key:
              </p>
              <pre className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
              </pre>
            </div>
          </div>

          {/* Optional AI Key */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-bold text-slate-200">Optional: AI Note Summarizer API Key</h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              SANKALP includes a built-in Extractive NLP Summarization heuristic that functions completely offline without any API key. If you wish to use live Google Gemini / LLM models, enter your API key below:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="AIzaSy... (Gemini API Key)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5"
              >
                {keySaved ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                <span>{keySaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
