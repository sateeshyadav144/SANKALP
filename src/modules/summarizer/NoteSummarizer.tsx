import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Save,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Tag,
  BookOpen,
  ArrowRight,
  ListChecks,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Note } from '../../types';

const SAMPLE_STUDY_PRESETS = [
  {
    title: 'Distributed Consensus & Raft Algorithm',
    subject: 'Computer Networks & Security',
    content: `Distributed consensus ensures that multiple nodes agree on a single data value or state machine log despite network partitions or server crashes. 
The Raft consensus algorithm breaks this complex problem into three sub-problems: Leader Election, Log Replication, and Safety.
1. Leader Election: Nodes start in Follower state. If no heartbeat is received within randomized election timeout (150-300ms), follower increments term and transitions to Candidate, requesting votes.
2. Log Replication: The elected leader receives client commands, appends them to its local log, and sends AppendEntries RPCs to followers. A log entry is committed once a majority of followers acknowledge it.
3. Safety Property: If a leader has committed an entry for a term, that entry will be present in the logs of all leaders for higher-numbered terms. A candidate must have an up-to-date log to win elections.`,
  },
  {
    title: 'PostgreSQL Indexes & B-Tree Mechanics',
    subject: 'Database Engineering',
    content: `A B-Tree (Balanced Tree) index is the default index type in relational database management systems like PostgreSQL. 
It maintains sorted key-pointer pairs in a self-balancing tree structure where all leaf nodes reside at equal depth.
1. Tree Structure: Consists of a root page, internal navigation pages, and leaf pages connected as a doubly linked list for efficient range scans (BETWEEN, <, >).
2. Time Complexity: Point lookups and range boundaries achieve O(log N) page reads.
3. High Concurrency: PostgreSQL employs page-level locks rather than full tree locks during traversals.
4. Maintenance Overhead: Writing new rows requires leaf splits when pages are full, causing index fragmentation that necessitates VACUUM operations.`,
  },
];

export const NoteSummarizer: React.FC = () => {
  const { user } = useAuth();
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  // Input states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Summarization outputs
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [engineUsed, setEngineUsed] = useState<'gemini' | 'heuristic'>('heuristic');

  // Status
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadSavedNotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getNotes(user.id);
      setNotesList(data);
      if (data.length > 0 && !activeNote) {
        selectNote(data[0]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedNotes();
  }, [user]);

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setContent(note.content);
    setSummary(note.summary || '');
    setKeyPoints(note.key_points || []);
    setActionItems(note.action_items || []);
    setTagsInput((note.tags || []).join(', '));
  };

  const handleNewNote = () => {
    setActiveNote(null);
    setTitle('');
    setSubject('General');
    setContent('');
    setSummary('');
    setKeyPoints([]);
    setActionItems([]);
    setTagsInput('');
  };

  // Heuristic Extractive NLP Summarizer (Transparent Offline Algorithm)
  const runHeuristicSummarizer = (text: string, noteTitle: string) => {
    const rawSentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    if (rawSentences.length === 0) {
      return {
        summaryText: text.slice(0, 200) + '...',
        points: ['Review full note text.'],
        actions: ['Read and prepare revision cards.'],
      };
    }

    // Word frequencies (stop-word filtered)
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'are', 'be', 'will'
    ]);
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const freq: Record<string, number> = {};
    words.forEach((w) => {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    });

    // Score sentences by term frequencies and title overlap
    const titleWords = new Set(noteTitle.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const scoredSentences = rawSentences.map((sentence, idx) => {
      let score = 0;
      const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      sWords.forEach((w) => {
        if (freq[w]) score += freq[w];
        if (titleWords.has(w)) score += 3; // title boost
      });
      // Positional boost: first and last sentences in paragraphs are usually topical
      if (idx === 0) score *= 1.4;
      return { sentence, score: score / Math.sqrt(sentence.length) };
    });

    scoredSentences.sort((a, b) => b.score - a.score);

    // Pick top 2-3 most salient sentences for concise summary
    const topSentences = scoredSentences.slice(0, Math.min(3, rawSentences.length));
    const summaryText = topSentences.map((s) => s.sentence).join(' ');

    // Extract bullet points
    const points = rawSentences.slice(0, Math.min(4, rawSentences.length)).map((s) => {
      return s.replace(/^(\d+\.|\-|\*)\s*/, '');
    });

    // Action items
    const actions = [
      `Review key terminology for "${noteTitle || 'this topic'}".`,
      'Create 3 flashcards in the Spaced Repetition module based on these concepts.',
      'Solve sample exam problems and verify definitions.',
    ];

    return { summaryText, points, actions };
  };

  // Live AI Summarization execution
  const handleSummarize = async () => {
    if (!content.trim()) {
      setErrorMsg('Please enter or paste note content to summarize.');
      return;
    }
    setErrorMsg(null);
    setProcessing(true);

    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      localStorage.getItem('sankalp_gemini_api_key') ||
      '';

    try {
      if (apiKey && apiKey.startsWith('AIza')) {
        // Live Gemini API Call with Structured JSON response prompt
        setEngineUsed('gemini');
        const prompt = `Act as an expert computer science and university academic tutor. Summarize the following lecture study note titled "${title || 'Study Note'}".
Provide a JSON response with the following format:
{
  "summary": "a 2-3 sentence clear and concise overview",
  "key_points": ["key takeaway 1", "key takeaway 2", "key takeaway 3", "key takeaway 4"],
  "action_items": ["actionable study step 1", "actionable study step 2"]
}
Study Note Content:
${content}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) throw new Error('Empty response from AI engine');

        const parsed = JSON.parse(rawJsonText);
        setSummary(parsed.summary || 'Summary generated.');
        setKeyPoints(parsed.key_points || []);
        setActionItems(parsed.action_items || []);
      } else {
        // Fallback: Intelligent Heuristic NLP Engine
        setEngineUsed('heuristic');
        // Slight artificial delay for UX feel
        await new Promise((r) => setTimeout(r, 600));
        const res = runHeuristicSummarizer(content, title);
        setSummary(res.summaryText);
        setKeyPoints(res.points);
        setActionItems(res.actions);
      }
    } catch (err: any) {
      console.warn('AI call failed, falling back to local heuristic summarizer:', err);
      setEngineUsed('heuristic');
      const res = runHeuristicSummarizer(content, title);
      setSummary(res.summaryText);
      setKeyPoints(res.points);
      setActionItems(res.actions);
    } finally {
      setProcessing(false);
    }
  };

  // Document Upload (.txt, .md, text files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text || '');
    };
    reader.readAsText(file);
  };

  // Save Note to Database
  const handleSaveNote = async () => {
    if (!user || !title.trim() || !content.trim()) {
      setErrorMsg('Please provide a note title and content.');
      return;
    }

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const saved = await apiService.saveNote(user.id, {
        id: activeNote?.id,
        title: title.trim(),
        subject,
        content,
        summary,
        key_points: keyPoints,
        action_items: actionItems,
        tags,
        is_ai_generated: engineUsed === 'gemini',
      });

      setActiveNote(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadSavedNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this saved note?')) return;
    try {
      await apiService.deleteNote(id);
      if (activeNote?.id === id) {
        handleNewNote();
      }
      await loadSavedNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleCopySummary = () => {
    const textToCopy = `Title: ${title}\n\nSummary:\n${summary}\n\nKey Points:\n${keyPoints.map((p) => `• ${p}`).join('\n')}\n\nAction Items:\n${actionItems.map((a) => `[ ] ${a}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Note Summarizer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transform lecture transcripts and notes into concise summaries, key points, and study action items.
          </p>
        </div>

        <button
          onClick={handleNewNote}
          className="px-4 py-2 text-xs font-semibold rounded-xl glass-panel text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 transition"
        >
          + New Note Workspace
        </button>
      </div>

      {/* Main Split Layout: Saved Notes Sidebar + Note Editor & Summary Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Saved Notes Library */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                Saved Notes ({notesList.length})
              </span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {notesList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No saved notes yet. Start writing or load a preset below.
                </div>
              ) : (
                notesList.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => selectNote(n)}
                    className={`p-3 rounded-xl cursor-pointer transition border text-left flex items-start justify-between ${
                      activeNote?.id === n.id
                        ? 'bg-violet-500/10 border-violet-500/30 text-white shadow-glow-violet'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold truncate text-slate-100">{n.title}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                        {n.subject}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {n.summary || n.content}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(n.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Presets to quickly test */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block mb-2">
                Sample Academic Presets:
              </span>
              <div className="flex flex-col gap-1.5">
                {SAMPLE_STUDY_PRESETS.map((p) => (
                  <button
                    key={p.title}
                    onClick={() => {
                      setActiveNote(null);
                      setTitle(p.title);
                      setSubject(p.subject);
                      setContent(p.content);
                      setSummary('');
                      setKeyPoints([]);
                      setActionItems([]);
                    }}
                    className="text-left text-xs text-cyan-400 hover:underline p-1.5 rounded bg-slate-900/40 truncate"
                  >
                    📄 {p.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Editor & Summarizer Output */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-4">
            {/* Note Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">Lecture / Note Title</label>
                <input
                  type="text"
                  placeholder="e.g. Memory Hierarchy and Cache Mapping"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Operating Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            {/* Content Area + Document Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Study Material & Lecture Notes
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    {content.length} characters • {content.trim() ? content.trim().split(/\s+/).length : 0} words
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline">
                    <Upload className="w-3 h-3" />
                    <span>Upload .txt / .md</span>
                    <input
                      type="file"
                      accept=".txt,.md,.text"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <textarea
                rows={9}
                placeholder="Paste your study notes, transcription, or textbook chapter here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl glass-input text-xs leading-relaxed font-mono resize-y"
              />
            </div>

            {/* Tags Input */}
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Tags (comma separated, e.g. Algorithms, Paging, ExamPrep)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Engine:{' '}
                  <span className={engineUsed === 'gemini' ? 'text-violet-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {engineUsed === 'gemini' ? 'Gemini 1.5 Flash' : 'Extractive NLP Heuristic'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={processing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white shadow-glow-violet transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>{processing ? 'Synthesizing...' : 'Generate Summary & Keypoints'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5"
                >
                  {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                  <span>{saveSuccess ? 'Saved!' : 'Save Note'}</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* AI Output Card (Summary, Key Points, Action Items) */}
          {summary && (
            <div className="p-5 rounded-2xl glass-panel border border-violet-500/30 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-white">Synthesized Revision Summary</h3>
                </div>

                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              {/* Summary Paragraph */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-violet-300 font-bold block mb-1">
                  Executive Abstract
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
                  {summary}
                </p>
              </div>

              {/* Key Bullet Points */}
              {keyPoints.length > 0 && (
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold block mb-2">
                    Key Revision Takeaways
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items for Revision */}
              {actionItems.length > 0 && (
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold block mb-2 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Actionable Revision Roadmap</span>
                  </span>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    {actionItems.map((act, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
