import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Save,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Loader2,
  Search,
  PanelLeft,
  PanelLeftClose,
  RotateCcw,
  BookMarked,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { extractTextFromPdf } from '../../services/aiFlashcardService';
import { Note } from '../../types';

const DEFAULT_SUBJECTS = [
  'General',
  'Computer Science',
  'Operating Systems',
  'Database Systems',
  'Computer Networks',
  'Software Engineering',
  'Data Structures & Algorithms',
  'Artificial Intelligence',
  'Mathematics',
  'Web Development',
];

// Transparent Heuristic Academic Summarizer
function extractStudyMaterialHeuristic(text: string, noteTitle: string) {
  const clean = text.trim();
  if (!clean) {
    return { summary: '', keyPoints: [], definitions: [], studyQuestions: [] };
  }

  const rawSentences = clean
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (rawSentences.length === 0) {
    return {
      summary: clean.slice(0, 240) + (clean.length > 240 ? '...' : ''),
      keyPoints: [clean.slice(0, 120)],
      definitions: [],
      studyQuestions: noteTitle ? [`What are the fundamental concepts of ${noteTitle}?`] : [],
    };
  }

  // 1. Executive Summary extraction (salience score)
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'are', 'be', 'will', 'have', 'has', 'was', 'were'
  ]);
  const words = clean.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });

  const titleWords = new Set((noteTitle || '').toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
  const scored = rawSentences.map((sentence, idx) => {
    let score = 0;
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    sWords.forEach((w) => {
      if (freq[w]) score += freq[w];
      if (titleWords.has(w)) score += 3;
    });
    if (idx === 0) score *= 1.3;
    return { sentence, score: score / Math.sqrt(sentence.length) };
  });

  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, Math.min(3, scored.length)).map((s) => s.sentence);
  const summary = topSentences.join(' ');

  // 2. Key Points (distinct salient points, stripped of leading numbers or bullets)
  const keyPoints: string[] = [];
  for (const s of rawSentences) {
    const cleanedPoint = s.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, '').trim();
    if (cleanedPoint.length > 20 && !keyPoints.includes(cleanedPoint)) {
      keyPoints.push(cleanedPoint);
    }
    if (keyPoints.length >= 4) break;
  }

  // 3. Definitions: scan for definition keywords or colon term patterns
  const definitions: string[] = [];
  const defRegex = /^([A-Z][A-Za-z0-9\s\-()]{2,35}):\s+(.*)/;
  const verbDefRegex = /\b([A-Z][A-Za-z0-9\s\-()]{2,35})\s+(?:is defined as|is an?|refers to|represents)\s+(.*)/i;

  for (const s of rawSentences) {
    const m1 = s.match(defRegex);
    if (m1 && m1[2].length > 10) {
      definitions.push(`${m1[1].trim()}: ${m1[2].trim()}`);
      continue;
    }
    const m2 = s.match(verbDefRegex);
    if (m2 && m2[2].length > 10) {
      definitions.push(`${m2[1].trim()}: ${m2[2].trim()}`);
    }
    if (definitions.length >= 4) break;
  }

  // 4. Study Questions: extract existing questions or generate relevant conceptual questions
  const studyQuestions: string[] = [];
  for (const s of rawSentences) {
    if (s.endsWith('?') && s.length > 15) {
      studyQuestions.push(s);
    }
    if (studyQuestions.length >= 2) break;
  }

  const topicName = noteTitle.trim() || 'this topic';
  if (studyQuestions.length < 3) {
    studyQuestions.push(`What is the fundamental mechanism behind ${topicName}?`);
  }
  if (definitions.length > 0 && studyQuestions.length < 3) {
    const firstTerm = definitions[0].split(':')[0].trim();
    studyQuestions.push(`How does ${firstTerm} operate in practical campus or system environments?`);
  }
  if (studyQuestions.length < 3) {
    studyQuestions.push(`What are the key trade-offs or constraints discussed in these notes?`);
  }

  return { summary, keyPoints, definitions, studyQuestions };
}

export const NoteSummarizer: React.FC = () => {
  const { user } = useAuth();
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Layout state: Collapsible saved notes panel
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Main Editor states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [content, setContent] = useState('');

  // AI Output states
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [studyQuestions, setStudyQuestions] = useState<string[]>([]);

  // Action & feedback states
  const [processing, setProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved notes
  const loadSavedNotes = async () => {
    if (!user) return;
    setLoadingNotes(true);
    try {
      const data = await apiService.getNotes(user.id);
      setNotesList(data || []);
      // If no active note currently selected and notes exist, select the most recent
      if (data && data.length > 0 && !activeNote) {
        selectNote(data[0]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    loadSavedNotes();
  }, [user]);

  // Select / Open Note
  const selectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setSubject(note.subject || 'General');
    setContent(note.content || '');
    setSummary(note.summary || '');
    setKeyPoints(note.key_points || []);

    // Decode definitions and study questions from action_items
    const rawActions = note.action_items || [];
    const defs = rawActions
      .filter((item) => item.startsWith('[Definition]'))
      .map((item) => item.replace('[Definition]', '').trim());
    const questions = rawActions
      .filter((item) => item.startsWith('[Question]'))
      .map((item) => item.replace('[Question]', '').trim());
    const legacy = rawActions.filter(
      (item) => !item.startsWith('[Definition]') && !item.startsWith('[Question]')
    );

    setDefinitions(defs);
    setStudyQuestions([...questions, ...legacy]);
    setErrorMsg(null);
  };

  // Reset / New Note
  const handleNewNote = () => {
    setActiveNote(null);
    setTitle('');
    setSubject('General');
    setContent('');
    setSummary('');
    setKeyPoints([]);
    setDefinitions([]);
    setStudyQuestions([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Word & Character counts
  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [content]);

  // Filtered Notes list for search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notesList;
    const q = searchQuery.toLowerCase();
    return notesList.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.subject && n.subject.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
    );
  }, [notesList, searchQuery]);

  // Combined subject list guaranteeing active subject is available
  const availableSubjects = useMemo(() => {
    if (subject && !DEFAULT_SUBJECTS.includes(subject)) {
      return [...DEFAULT_SUBJECTS, subject];
    }
    return DEFAULT_SUBJECTS;
  }, [subject]);

  // File Upload (PDF, TXT, MD)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '');
    if (!title.trim()) {
      setTitle(fileNameNoExt);
    }

    setErrorMsg(null);

    // PDF processing
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setLoadingFile(true);
      try {
        const res = await extractTextFromPdf(file);
        if (res.hasContent && res.text.trim()) {
          setContent(res.text.trim());
          setSuccessMsg(`Imported text from "${file.name}"`);
          setTimeout(() => setSuccessMsg(null), 3000);
        } else if (res.isEncrypted) {
          setErrorMsg('The selected PDF is password protected or encrypted.');
        } else {
          setErrorMsg('Could not extract text from this PDF (it may contain scanned image pages).');
        }
      } catch (err: any) {
        setErrorMsg('Failed to process PDF: ' + (err?.message || 'Unknown error'));
      } finally {
        setLoadingFile(false);
        e.target.value = '';
      }
      return;
    }

    // TXT, MD, text files
    try {
      const text = await file.text();
      setContent(text);
      setSuccessMsg(`Imported text from "${file.name}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to read text file: ' + (err?.message || 'Unknown error'));
    } finally {
      e.target.value = '';
    }
  };

  // Live AI Summarization execution
  const handleSummarize = async () => {
    if (!content.trim()) {
      setErrorMsg('Please enter or paste your study notes before generating a summary.');
      return;
    }

    setErrorMsg(null);
    setProcessing(true);

    const prompt = `Act as an expert university professor and academic tutor. Analyze the following lecture study note titled "${title || 'Study Note'}".
Return a JSON object with this exact schema:
{
  "summary": "a 2-3 sentence clear and concise academic overview",
  "key_points": ["key takeaway 1", "key takeaway 2", "key takeaway 3"],
  "definitions": ["Term: definition explanation", "Term 2: definition explanation"],
  "study_questions": ["Study question 1?", "Study question 2?", "Study question 3?"]
}
Study Note Content:
${content.slice(0, 8000)}`;

    try {
      // 1. Attempt Server-Side Gemini Proxy
      const aiResult = await apiService.invokeGeminiAi({
        actionType: 'ai_notes',
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });

      if (aiResult.success && aiResult.data) {
        const rawJson = aiResult.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          setSummary(parsed.summary || '');
          setKeyPoints(Array.isArray(parsed.key_points) ? parsed.key_points : []);
          setDefinitions(Array.isArray(parsed.definitions) ? parsed.definitions : []);
          setStudyQuestions(Array.isArray(parsed.study_questions) ? parsed.study_questions : []);
          return;
        }
      }

      // 2. Intelligent Heuristic Fallback
      await new Promise((r) => setTimeout(r, 350));
      const fallback = extractStudyMaterialHeuristic(content, title);
      setSummary(fallback.summary);
      setKeyPoints(fallback.keyPoints);
      setDefinitions(fallback.definitions);
      setStudyQuestions(fallback.studyQuestions);
    } catch (err: any) {
      if (err?.message && err.message.includes('Rate limit')) {
        setErrorMsg(err.message);
        return;
      }
      console.warn('AI service fallback engaged:', err?.message);
      const fallback = extractStudyMaterialHeuristic(content, title);
      setSummary(fallback.summary);
      setKeyPoints(fallback.keyPoints);
      setDefinitions(fallback.definitions);
      setStudyQuestions(fallback.studyQuestions);
    } finally {
      setProcessing(false);
    }
  };

  // Save Note to Database
  const handleSaveNote = async () => {
    if (!user) {
      setErrorMsg('Please sign in to save your notes.');
      return;
    }

    if (!content.trim() && !summary.trim()) {
      setErrorMsg('Please write notes or generate a summary before saving.');
      return;
    }

    const resolvedTitle =
      title.trim() ||
      (subject !== 'General'
        ? `${subject} Notes`
        : content.trim().slice(0, 32).trim() + (content.trim().length > 32 ? '...' : '') ||
          'Study Note - ' + new Date().toLocaleDateString());

    setErrorMsg(null);
    setIsSaving(true);

    try {
      // Store definitions and study questions encoded into action_items for backward compatibility
      const actionItemsToSave: string[] = [
        ...definitions.map((d) => `[Definition] ${d}`),
        ...studyQuestions.map((q) => `[Question] ${q}`),
      ];

      const saved = await apiService.saveNote(user.id, {
        id: activeNote?.id,
        title: resolvedTitle,
        subject: subject.trim() || 'General',
        content: content.trim() || summary.trim(),
        summary: summary.trim(),
        key_points: keyPoints,
        action_items: actionItemsToSave,
        tags: activeNote?.tags || ['StudyNote'],
        is_ai_generated: Boolean(summary),
      });

      if (!saved || !saved.id) {
        throw new Error('Database did not confirm saved note.');
      }

      setActiveNote(saved);
      setTitle(saved.title);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await loadSavedNotes();
    } catch (err: any) {
      console.error('Error saving note:', err);
      setErrorMsg(err?.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Note with Confirmation
  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this study note permanently?')) return;
    try {
      await apiService.deleteNote(id);
      if (activeNote?.id === id) {
        handleNewNote();
      }
      await loadSavedNotes();
    } catch (err: any) {
      console.error('Error deleting note:', err);
      setErrorMsg(err?.message || 'Failed to delete note.');
    }
  };

  // Copy AI Output to Clipboard
  const handleCopyOutput = () => {
    const sections: string[] = [];
    if (title) sections.push(`Title: ${title} (${subject})`);
    if (summary) sections.push(`AI SUMMARY:\n${summary}`);
    if (keyPoints.length > 0) {
      sections.push(`IMPORTANT KEY POINTS:\n${keyPoints.map((p) => `• ${p}`).join('\n')}`);
    }
    if (definitions.length > 0) {
      sections.push(`IMPORTANT DEFINITIONS:\n${definitions.map((d) => `• ${d}`).join('\n')}`);
    }
    if (studyQuestions.length > 0) {
      sections.push(`STUDY QUESTIONS:\n${studyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`);
    }

    navigator.clipboard.writeText(sections.join('\n\n'));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Format date helper
  const formatNoteDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 3600);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return 'Today';
    }
    if (diffHours < 48 && d.getDate() === now.getDate() - 1) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const hasOutput = Boolean(
    summary || keyPoints.length > 0 || definitions.length > 0 || studyQuestions.length > 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-[1550px] mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17365C]/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#087BFF]/30">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
              AI Notes
            </h1>
            <p className="text-xs text-[#9BAFCB]">
              Create, summarize and organize your study notes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Toggle Collapsible Notes Sidebar */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-[#071B35] border border-[#17365C] text-[#9BAFCB] hover:text-[#00D9FF] hover:border-[#00D9FF]/40 transition flex items-center gap-2 shadow-sm"
            title={isSidebarOpen ? 'Hide Saved Notes' : 'Show Saved Notes'}
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4 text-[#00D9FF]" />
                <span className="hidden md:inline">Hide Notes</span>
              </>
            ) : (
              <>
                <PanelLeft className="w-4 h-4 text-[#00D9FF]" />
                <span>Saved Notes ({notesList.length})</span>
              </>
            )}
          </button>

          {/* New Note Button */}
          <button
            type="button"
            onClick={handleNewNote}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5 shadow-lg shadow-[#087BFF]/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================== */}
        {/* 4. SAVED NOTES (Compact, Collapsible Left Panel) */}
        {/* =================================================================== */}
        {isSidebarOpen && (
          <aside className="lg:col-span-4 space-y-3 animate-in fade-in duration-200">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#071B35] border border-[#17365C] space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F4F7FF] uppercase tracking-wider font-mono">
                  Saved Notes ({filteredNotes.length})
                </span>
                <span className="text-[10px] text-[#9BAFCB] font-mono">Recent First</span>
              </div>

              {/* Search Notes Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9BAFCB] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notes, subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-[#9BAFCB]/50 focus:outline-none focus:border-[#00D9FF] transition"
                />
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {loadingNotes ? (
                  <div className="py-10 text-center text-xs text-[#9BAFCB] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00D9FF]" />
                    <span>Loading library...</span>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#9BAFCB] space-y-1">
                    <FileText className="w-6 h-6 mx-auto text-[#17365C]" />
                    <p>{searchQuery ? 'No notes match your search.' : 'No saved notes yet.'}</p>
                  </div>
                ) : (
                  filteredNotes.map((n) => {
                    const isSelected = activeNote?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => selectNote(n)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border text-left flex items-start justify-between group ${
                          isSelected
                            ? 'bg-[#087BFF]/15 border-[#00D9FF] text-[#F4F7FF] shadow-[0_0_15px_rgba(0,217,255,0.1)]'
                            : 'bg-[#030E1F] border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF] hover:bg-[#081F3D]/60 hover:border-[#17365C]/80'
                        }`}
                      >
                        <div className="min-w-0 pr-2 flex-1">
                          <p className="text-xs font-bold truncate text-[#F4F7FF] group-hover:text-[#00D9FF] transition">
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#061830] border border-[#17365C] text-[#00D9FF] truncate max-w-[120px]">
                              {n.subject || 'General'}
                            </span>
                            <span className="text-[10px] text-[#9BAFCB]/70 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatNoteDate(n.updated_at || n.created_at)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteNote(n.id, e)}
                          className="p-1.5 rounded-lg text-[#9BAFCB] hover:text-rose-400 hover:bg-[#061830] transition opacity-0 group-hover:opacity-100"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        )}

        {/* =================================================================== */}
        {/* 2. MAIN EDITOR & 3. AI OUTPUT AREA */}
        {/* =================================================================== */}
        <main className={`${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          {/* Editor Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-xl space-y-4">
            {/* Top Row: Title Input & Subject Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Note Title (e.g. Distributed Consensus & Raft)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm font-semibold text-[#F4F7FF] placeholder-[#9BAFCB]/50 focus:outline-none focus:border-[#00D9FF] transition"
                />
              </div>

              <div className="w-full sm:w-56 shrink-0">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition cursor-pointer"
                >
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Writing Area Toolbar: Counts & PDF/TXT Upload */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-[#9BAFCB]">
                {content.length} characters • {wordCount} words
              </span>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#061830] border border-[#17365C] hover:border-[#00D9FF]/40 text-xs font-medium text-[#00D9FF] hover:text-white transition"
                >
                  {loadingFile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading file...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload PDF / TXT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Large Writing Area */}
            <div>
              <textarea
                rows={12}
                placeholder="Write, paste study notes, or upload a PDF/TXT lecture file to analyze..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 rounded-xl bg-[#061830] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/50 leading-relaxed font-mono resize-y focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            {/* Bottom Actions: Generate Summary & Save Note */}
            <div className="flex items-center justify-between pt-3 border-t border-[#17365C]">
              <div className="text-xs text-[#9BAFCB]">
                {activeNote ? (
                  <span className="text-[11px] font-mono text-[#00D9FF]">
                    Editing: {activeNote.title}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#9BAFCB]">Unsaved Draft</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Save Note Button */}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isSaving || processing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 text-[#F4F7FF] transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D9FF]" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-[#00D9FF]" />
                      <span>{activeNote ? 'Update Note' : 'Save Note'}</span>
                    </>
                  )}
                </button>

                {/* Generate Summary Button */}
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={processing || !content.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5 shadow-lg shadow-[#087BFF]/20 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
                      <span>Generate Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Generating Feedback Card */}
          {processing && (
            <div className="p-8 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-xl flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00D9FF]" />
              <div className="text-center">
                <p className="text-sm font-bold text-[#F4F7FF]">Synthesizing Study Workspace Output...</p>
                <p className="text-xs text-[#9BAFCB] mt-0.5">
                  Extracting core concepts, definitions, and revision questions.
                </p>
              </div>
            </div>
          )}

          {/* 3. AI OUTPUT SECTIONS (Only visible when generated content exists) */}
          {hasOutput && !processing && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-2xl space-y-5">
              {/* Output Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#17365C]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                  <h2 className="text-sm font-bold text-[#F4F7FF] tracking-tight">
                    Study Workspace Output
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSummarize}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono text-[#9BAFCB] hover:text-[#00D9FF] bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 transition"
                    title="Regenerate Summary"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono text-[#00D9FF] bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 transition"
                  >
                    {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copySuccess ? 'Copied!' : 'Copy All'}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: AI Summary */}
              {summary && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00D9FF] font-mono">
                    AI Summary
                  </span>
                  <div className="p-4 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF] leading-relaxed">
                    {summary}
                  </div>
                </div>
              )}

              {/* Section 2: Important Key Points */}
              {keyPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#087BFF] font-mono">
                    Important Key Points
                  </span>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#F4F7FF]">
                    {keyPoints.map((pt, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-[#030E1F] border border-[#17365C]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] mt-2 shrink-0" />
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section 3: Important Definitions */}
              {definitions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A78BFA] font-mono">
                    Important Definitions
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {definitions.map((def, idx) => {
                      const parts = def.split(':');
                      const term = parts[0].trim();
                      const explanation = parts.slice(1).join(':').trim();
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs space-y-1"
                        >
                          <p className="font-bold text-[#A78BFA]">{term}</p>
                          <p className="text-[#F4F7FF] leading-relaxed">{explanation || def}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 4: Study Questions */}
              {studyQuestions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00D6B5] font-mono">
                    Study Questions
                  </span>
                  <div className="space-y-2">
                    {studyQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF]"
                      >
                        <span className="font-mono font-bold text-[#00D6B5] shrink-0">
                          Q{idx + 1}.
                        </span>
                        <span className="leading-relaxed">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Save Confirmation Button at bottom of output */}
              <div className="pt-3 border-t border-[#17365C] flex items-center justify-between">
                <span className="text-xs text-[#9BAFCB]">
                  Save this synthesized study workspace output directly to your library.
                </span>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{saveSuccess ? 'Saved to Library' : 'Save Note to Library'}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
