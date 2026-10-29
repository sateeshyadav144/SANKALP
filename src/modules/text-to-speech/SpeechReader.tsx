import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sliders,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Note } from '../../types';

const SAMPLE_LECTURE_SCRIPTS = [
  {
    title: 'Cache Coherence & MESI Protocol',
    text: `In a multi-processor computer architecture, each CPU core maintains its own private L1 and L2 caches. 
When multiple processors read and write to the same shared memory location, cache coherence protocols prevent data divergence.
The MESI protocol categorizes cache lines into four distinct states:
First, Modified: The cache line is present only in the current cache and is dirty, meaning it differs from main memory.
Second, Exclusive: The cache line is present only in the current cache and is clean, matching main memory.
Third, Shared: The cache line may be stored in other caches of the machine and is clean.
Fourth, Invalid: The cache line does not contain valid data and must be refetched upon access.`,
  },
  {
    title: 'Diffie-Hellman Cryptographic Key Exchange',
    text: `Diffie-Hellman key exchange is a foundational mathematical method of securely exchanging cryptographic keys over a public channel.
Two parties, commonly referred to as Alice and Bob, agree on a public prime modulus p and a generator base g.
Alice selects a private secret integer a and transmits g raised to the power of a modulo p.
Bob selects a private secret integer b and transmits g raised to the power of b modulo p.
Both parties can then compute the identical shared secret key without ever exposing their private secrets to an eavesdropper.`,
  },
];

export const SpeechReader: React.FC = () => {
  const { user } = useAuth();
  const [text, setText] = useState(SAMPLE_LECTURE_SCRIPTS[0].text);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (available.length > 0 && !selectedVoiceURI) {
        // Prefer natural English voices if found
        const preferred =
          available.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) ||
          available.find((v) => v.lang.startsWith('en')) ||
          available[0];
        if (preferred) setSelectedVoiceURI(preferred.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    // Load user's notes so they can listen to their own study notes
    if (user) {
      apiService.getNotes(user.id).then(setSavedNotes).catch(console.error);
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [user]);

  const handleSpeak = () => {
    if (!text.trim() || !isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    if (selectedVoiceURI) {
      const v = voices.find((item) => item.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedReadTimeMinutes = Math.max(1, Math.round(wordCount / 140));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Text-to-Speech & Lecture Audio Reader
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Listen to your lecture notes, textbook summaries, and revision flashcards hands-free with native speech synthesis.
          </p>
        </div>

        {/* Privacy badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Client-Side Private Audio</span>
        </div>
      </div>

      {!isSupported && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-rose-400" />
          <span>
            SpeechSynthesis API is not supported by your current browser. Try Chrome, Edge, or Safari on desktop.
          </span>
        </div>
      )}

      {/* Main Reader Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text Input & Presets */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Study Material Text
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {wordCount} words • ~{estimatedReadTimeMinutes} min listen
              </span>
            </div>

            <textarea
              rows={11}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter study notes or formulas to read aloud..."
              className="w-full p-4 rounded-xl glass-input text-xs sm:text-sm font-sans leading-relaxed resize-y"
            />

            {/* Quick Load from Notes */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Load from:</span>
              {SAMPLE_LECTURE_SCRIPTS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => setText(s.text)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {s.title}
                </button>
              ))}
              {savedNotes.slice(0, 2).map((n) => (
                <button
                  key={n.id}
                  onClick={() => setText(n.summary || n.content)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition truncate max-w-[180px]"
                >
                  📝 {n.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Audio Controls & Voice Configuration */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-amber-500/20 space-y-5 shadow-2xl">
            {/* Visualizer Wave Animation */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1.5 h-10 mb-2">
                {[40, 70, 30, 90, 60, 100, 45, 80, 50, 65, 85, 35].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isPlaying ? `${h}%` : '20%',
                      transition: 'height 0.2s ease',
                    }}
                    className={`w-1 rounded-full ${
                      isPlaying ? 'bg-amber-400 shadow-glow-cyan' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-mono font-semibold text-slate-300">
                {isPlaying ? 'Speaking Lecture Audio...' : isPaused ? 'Audio Paused' : 'Ready to Speak'}
              </p>
            </div>

            {/* Playback Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSpeak}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white shadow-glow-blue transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isPaused ? 'Resume' : 'Play Speech'}</span>
              </button>

              <button
                onClick={handlePause}
                disabled={!isPlaying}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                onClick={handleStop}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Voice Selection */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-300 block">
                Speech Synthesizer Voice ({voices.length})
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-white">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Voices depend on your local operating system synthesizer.
              </p>
            </div>

            {/* Speed (Rate) Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Speed / Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <button onClick={() => setRate(0.8)} className="hover:text-cyan-300">0.8x</button>
                <button onClick={() => setRate(1.0)} className="hover:text-cyan-300">1.0x Normal</button>
                <button onClick={() => setRate(1.2)} className="hover:text-cyan-300">1.2x</button>
                <button onClick={() => setRate(1.5)} className="hover:text-cyan-300">1.5x Fast</button>
              </div>
            </div>

            {/* Pitch Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Pitch</span>
                <span className="font-mono text-cyan-400 font-bold">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
