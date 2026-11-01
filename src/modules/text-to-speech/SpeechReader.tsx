// ==============================================================================
// SANKALP — Text-to-Speech Reader
// Clean, simple, student-friendly audio study interface
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Bookmark,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { SavedSpeechNote, IndianLanguageOption } from '../../types';
import {
  OFFICIAL_INDIAN_LANGUAGES,
  getPlayableLanguages,
  getCleanVoicesForLanguage,
  CleanVoiceOption,
  splitTextIntoUtteranceChunks,
  calculateSpeechDurationSeconds,
  formatDuration,
} from '../../services/ttsService';
import {
  validatePdfUpload,
  extractPdfContent,
} from '../../services/pdfTopicService';

export const SpeechReader: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_guest';

  // --- Input State ---
  const [inputMode, setInputMode] = useState<'write' | 'pdf'>('write');
  const [text, setText] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('My Study Notes');

  // --- PDF Upload State ---
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Language & Voice State ---
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('hi-IN');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  // --- Audio Player State ---
  const [rate, setRate] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [cloudDuration, setCloudDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Audio & Timer Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Saved Notes Library ---
  const [savedNotes, setSavedNotes] = useState<SavedSpeechNote[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Initial Load & Voice Discovery
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        setSystemVoices(window.speechSynthesis.getVoices());
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }

    // Load saved notes for student
    apiService
      .getSavedSpeechNotes(userId)
      .then(setSavedNotes)
      .catch((err) => console.warn('Could not load saved speech notes:', err));

    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userId]);

  // Genuine playable languages
  const playableLanguages = getPlayableLanguages(systemVoices);

  // Selected language object
  const currentLang =
    playableLanguages.find((l) => l.code === selectedLanguageCode) ||
    playableLanguages[0] ||
    OFFICIAL_INDIAN_LANGUAGES[0];

  // Genuinely available voices for selected language
  const availableVoices = getCleanVoicesForLanguage(currentLang, systemVoices);

  // Maintain valid voice selection
  useEffect(() => {
    if (availableVoices.length > 0) {
      if (!availableVoices.some((v) => v.id === selectedVoiceId)) {
        setSelectedVoiceId(availableVoices[0].id);
      }
    } else {
      setSelectedVoiceId('');
    }
  }, [selectedLanguageCode, systemVoices]);

  // Invalidate generated audio if text or language changes
  const handleTextChange = (newText: string) => {
    setText(newText);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setCloudDuration(0);
    }
  };

  // Timer for elapsed seconds in local synthesis mode
  useEffect(() => {
    const isLocalVoice = selectedVoiceId && !selectedVoiceId.startsWith('cloud_');
    if (isPlaying && !isPaused && isLocalVoice) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (isLocalVoice) {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isPaused, selectedVoiceId]);

  // ---------------------------------------------------------------------------
  // 2. PDF Upload & Text Extraction
  // ---------------------------------------------------------------------------
  const handlePdfUpload = async (file: File) => {
    setPdfError(null);
    setPdfSuccessMsg(null);

    const validation = validatePdfUpload(file);
    if (!validation.valid) {
      setPdfError(validation.error || 'Please upload a valid PDF file.');
      return;
    }

    setUploadedPdf(file);
    setIsExtractingPdf(true);

    try {
      const extracted = await extractPdfContent(file);
      if (!extracted.fullText || !extracted.fullText.trim()) {
        setPdfError(
          extracted.error ||
            'Could not read text from this PDF. Please ensure it contains readable text.'
        );
      } else {
        handleTextChange(extracted.fullText);
        setNoteTitle(file.name.replace(/\.[^/.]+$/, ''));
        setPdfSuccessMsg(
          `Extracted ${extracted.pageCount} page(s) • Ready for speech generation.`
        );
        // Switch to editor so student can review and edit
        setInputMode('write');
      }
    } catch (err) {
      setPdfError('Could not process this PDF file. Please try another document.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Speech Generation & Playback
  // ---------------------------------------------------------------------------
  const handleGenerateOrPlay = async () => {
    if (!text.trim()) {
      setPlayerError('Please enter some study notes or upload a PDF first.');
      return;
    }

    setPlayerError(null);

    // If currently paused, resume playback
    if (isPaused) {
      if (audioRef.current && audioUrl) {
        audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
      }
      return;
    }

    // Stop existing playback
    handleStop();

    const isCloud = selectedVoiceId.startsWith('cloud_');

    if (isCloud) {
      await playCloudSpeech();
    } else {
      playLocalSpeech();
    }
  };

  // A. Local Browser Playback
  const playLocalSpeech = () => {
    const chunks = splitTextIntoUtteranceChunks(text);
    if (chunks.length === 0) return;

    setTotalChunks(chunks.length);
    setCurrentChunkIndex(0);
    setElapsedSeconds(0);
    setIsPlaying(true);
    setIsPaused(false);

    speakChunkSequence(chunks, 0);
  };

  const speakChunkSequence = (chunks: string[], index: number) => {
    if (index >= chunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      return;
    }

    setCurrentChunkIndex(index);
    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    const voice = systemVoices.find((v) => v.voiceURI === selectedVoiceId);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = currentLang.code;
    }

    utterance.rate = rate;

    utterance.onend = () => {
      speakChunkSequence(chunks, index + 1);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        setPlayerError('Audio playback was interrupted.');
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // B. Cloud Speech Generation & Audio Playback
  const playCloudSpeech = async () => {
    setIsGenerating(true);
    try {
      let activeUrl = audioUrl;

      // Synthesize audio if not already generated
      if (!activeUrl) {
        const { audioUrl: newUrl } = await apiService.synthesizeCloudSpeech(
          text,
          currentLang.code,
          currentLang.iso639
        );
        setAudioUrl(newUrl);
        activeUrl = newUrl;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = activeUrl;
      audio.playbackRate = rate;

      audio.onloadedmetadata = () => {
        setCloudDuration(audio.duration || 0);
      };

      audio.ontimeupdate = () => {
        setElapsedSeconds(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setElapsedSeconds(0);
      };

      audio.onerror = () => {
        setPlayerError('Could not play audio. Please try again.');
        setIsPlaying(false);
        setIsPaused(false);
      };

      await audio.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err: any) {
      setPlayerError(err.message || 'Speech generation failed. Please try again.');
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePause = () => {
    if (isPlaying && !isPaused) {
      if (audioRef.current && audioUrl) {
        audioRef.current.pause();
      } else {
        window.speechSynthesis.pause();
      }
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    setElapsedSeconds(0);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  // Quick Voice Preview
  const handlePreviewVoice = async () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
    setIsPreviewing(true);

    try {
      const isCloud = selectedVoiceId.startsWith('cloud_');
      if (isCloud) {
        const { audioUrl: previewUrl } = await apiService.synthesizeCloudSpeech(
          currentLang.sampleGreeting,
          currentLang.code,
          currentLang.iso639
        );
        const pAudio = new Audio(previewUrl);
        pAudio.playbackRate = rate;
        pAudio.onended = () => setIsPreviewing(false);
        pAudio.onerror = () => setIsPreviewing(false);
        await pAudio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(currentLang.sampleGreeting);
        const voice = systemVoices.find((v) => v.voiceURI === selectedVoiceId);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = currentLang.code;
        }
        utterance.rate = rate;
        utterance.onend = () => setIsPreviewing(false);
        utterance.onerror = () => setIsPreviewing(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsPreviewing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Save Study Material
  // ---------------------------------------------------------------------------
  const handleSaveSpeechNote = async () => {
    if (!text.trim() || isSaving) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const activeVoice = availableVoices.find((v) => v.id === selectedVoiceId);

    try {
      const saved = await apiService.saveSpeechNote(userId, {
        title: noteTitle.trim() || 'Study Notes',
        text: text.trim(),
        language_code: currentLang.code,
        language_name: currentLang.name,
        voice_name: activeVoice?.name || 'Standard Voice',
        voice_gender: activeVoice?.gender || 'unspecified',
      });

      setSavedNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
      setSaveSuccessMsg('Notes saved to audio library!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch {
      alert('Could not save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedNote = (saved: SavedSpeechNote) => {
    handleStop();
    handleTextChange(saved.text);
    setNoteTitle(saved.title);
    setSelectedLanguageCode(saved.language_code);
    setIsSavedDrawerOpen(false);
  };

  const handleDeleteSavedNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved note?')) return;
    try {
      await apiService.deleteSavedSpeechNote(id);
      setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.warn('Failed to delete note:', err);
    }
  };

  // Metrics
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;
  const isCloudAudioActive = selectedVoiceId.startsWith('cloud_');
  const totalDuration =
    isCloudAudioActive && cloudDuration > 0
      ? Math.ceil(cloudDuration)
      : calculateSpeechDurationSeconds(text, rate);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* =================================================================== */}
      {/* 1. CLEAN HEADER                                                     */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#17365C]/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Text-to-Speech Reader
              </h1>
              <p className="text-xs text-[#9BAFCB] mt-0.5">
                Convert your study notes and documents into clear speech.
              </p>
            </div>
          </div>
        </div>

        {/* Saved Notes Trigger */}
        <button
          type="button"
          onClick={() => setIsSavedDrawerOpen(!isSavedDrawerOpen)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#061830] text-[#9BAFCB] hover:text-white border border-[#17365C] hover:border-[#00D9FF]/40 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Bookmark className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span>Saved Notes ({savedNotes.length})</span>
        </button>
      </div>

      {/* Saved Notes Drawer */}
      {isSavedDrawerOpen && (
        <div className="rounded-2xl bg-[#061830] border border-[#17365C] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Saved Study Materials
            </h3>
            <span className="text-[11px] text-[#9BAFCB]">
              Click any note to load it
            </span>
          </div>

          {savedNotes.length === 0 ? (
            <p className="text-xs text-[#9BAFCB] italic py-2">
              No saved materials yet. Type or extract notes below and click "Save Notes".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {savedNotes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadSavedNote(item)}
                  className="p-3 rounded-xl bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-[#00D9FF] truncate">
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedNote(item.id, e)}
                        className="text-[#9BAFCB] hover:text-rose-400 p-0.5 transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#9BAFCB] line-clamp-2">
                      {item.text}
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#17365C]/60 flex items-center justify-between text-[10px] text-[#9BAFCB]">
                    <span>{item.language_name}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. MAIN WORKSPACE CARD                                              */}
      {/* =================================================================== */}
      <div className="rounded-2xl bg-[#061830] border border-[#17365C] p-5 space-y-4 shadow-lg">
        {/* Top Controls: Input Mode & Word Count */}
        <div className="flex items-center justify-between border-b border-[#17365C]/60 pb-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#030E1F] border border-[#17365C]">
            <button
              type="button"
              onClick={() => setInputMode('write')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'write'
                  ? 'bg-[#00D9FF] text-[#020B1A]'
                  : 'text-[#9BAFCB] hover:text-white'
              }`}
            >
              Write Notes
            </button>
            <button
              type="button"
              onClick={() => setInputMode('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'pdf'
                  ? 'bg-[#00D9FF] text-[#020B1A]'
                  : 'text-[#9BAFCB] hover:text-white'
              }`}
            >
              Upload PDF
            </button>
          </div>

          {/* Counts & Clear */}
          <div className="flex items-center gap-3 text-xs text-[#9BAFCB]">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount.toLocaleString()} chars</span>
            {text.trim() && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleTextChange('')}
                  className="text-rose-400 hover:underline"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Note Title Input */}
        <input
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note Title (e.g. Chapter 4 Summary)"
          className="w-full px-3.5 py-2 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs font-medium text-white placeholder-[#9BAFCB]/50 focus:outline-none focus:border-[#00D9FF]"
        />

        {/* Input Option 1: Write Notes Textarea */}
        {inputMode === 'write' ? (
          <div>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type or paste your study notes here..."
              className="w-full p-3.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/50 leading-relaxed resize-y focus:outline-none focus:border-[#00D9FF]"
            />
          </div>
        ) : (
          /* Input Option 2: Upload PDF */
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handlePdfUpload(file);
              }}
              className="border-2 border-dashed border-[#17365C] hover:border-[#00D9FF]/50 rounded-xl p-6 text-center cursor-pointer transition bg-[#030E1F]/60"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                className="hidden"
                disabled={isExtractingPdf}
              />

              <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 text-[#00D9FF] flex items-center justify-center">
                  {isExtractingPdf ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">
                    {isExtractingPdf
                      ? 'Extracting notes from PDF...'
                      : uploadedPdf
                      ? uploadedPdf.name
                      : 'Choose or drop notes PDF'}
                  </h4>
                  <p className="text-[11px] text-[#9BAFCB] mt-0.5">
                    {isExtractingPdf
                      ? 'Reading embedded text streams...'
                      : uploadedPdf
                      ? `${(uploadedPdf.size / (1024 * 1024)).toFixed(1)} MB • Click to replace`
                      : 'Supports study notes and documents (Max: 10 MB)'}
                  </p>
                </div>
              </div>
            </div>

            {pdfError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{pdfError}</span>
              </div>
            )}

            {pdfSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{pdfSuccessMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. LANGUAGE & VOICE SELECTION                                     */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F4F7FF]">
              Select Language
            </label>
            <select
              value={selectedLanguageCode}
              onChange={(e) => {
                handleStop();
                setSelectedLanguageCode(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs sm:text-sm text-white focus:outline-none focus:border-[#00D9FF]"
            >
              {playableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#030E1F] text-white">
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#F4F7FF]">
                Select Voice
              </label>
              {availableVoices.length > 0 && (
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  disabled={isPreviewing || isPlaying}
                  className="text-[11px] text-[#00D9FF] hover:underline font-medium disabled:opacity-50"
                >
                  {isPreviewing ? 'Listening...' : '▶ Preview Voice'}
                </button>
              )}
            </div>

            <select
              value={selectedVoiceId}
              onChange={(e) => {
                handleStop();
                setSelectedVoiceId(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs sm:text-sm text-white focus:outline-none focus:border-[#00D9FF]"
            >
              {availableVoices.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#030E1F] text-white">
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. AUDIO PLAYER & ACTIONS                                         */}
        {/* ================================================================= */}
        <div className="pt-3 border-t border-[#17365C]/60 space-y-3.5">
          {/* Progress & Duration */}
          <div className="flex items-center justify-between text-xs text-[#9BAFCB]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-[#00D9FF] animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-500'
                }`}
              />
              <span className="font-medium text-white">
                {isGenerating
                  ? 'Generating speech...'
                  : isPlaying
                  ? 'Playing audio'
                  : isPaused
                  ? 'Paused'
                  : 'Ready'}
              </span>
            </div>

            <div className="font-mono text-xs">
              <span>{formatDuration(elapsedSeconds)}</span>
              <span> / </span>
              <span>~{formatDuration(totalDuration)}</span>
            </div>
          </div>

          {/* Simple Progress Bar */}
          <div className="w-full bg-[#030E1F] h-2 rounded-full overflow-hidden border border-[#17365C]">
            <div
              style={{
                width:
                  totalDuration > 0
                    ? `${Math.min(100, Math.round((elapsedSeconds / totalDuration) * 100))}%`
                    : '0%',
              }}
              className="h-full bg-[#00D9FF] transition-all duration-300 rounded-full"
            />
          </div>

          {/* Controls & Speed */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* Generate Speech / Play / Resume */}
              <button
                type="button"
                onClick={handleGenerateOrPlay}
                disabled={!text.trim() || isGenerating}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#020B1A] bg-[#00D9FF] hover:bg-[#00D9FF]/90 transition flex items-center gap-2 disabled:opacity-40"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#020B1A]" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>
                  {isGenerating
                    ? 'Generating...'
                    : isPaused
                    ? 'Resume'
                    : isPlaying
                    ? 'Restart'
                    : 'Generate Speech'}
                </span>
              </button>

              {/* Pause */}
              <button
                type="button"
                onClick={handlePause}
                disabled={!isPlaying}
                className="p-2.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-[#9BAFCB] hover:text-white disabled:opacity-40 transition"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>

              {/* Stop */}
              <button
                type="button"
                onClick={handleStop}
                disabled={!isPlaying && !isPaused}
                className="p-2.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-[#9BAFCB] hover:text-rose-400 disabled:opacity-40 transition"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Speed Switcher */}
            <div className="flex items-center gap-1 bg-[#030E1F] p-1 rounded-xl border border-[#17365C]">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleRateChange(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                    rate === s
                      ? 'bg-[#00D9FF] text-[#020B1A]'
                      : 'text-[#9BAFCB] hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Secondary Actions: Download & Save */}
            <div className="flex items-center gap-2">
              {audioUrl && (
                <a
                  href={audioUrl}
                  download={`${noteTitle || 'sankalp-study-notes'}.mp3`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 transition flex items-center gap-1.5"
                  title="Download MP3 Audio"
                >
                  <Download className="w-3.5 h-3.5 text-[#00D9FF]" />
                  <span>Download Audio</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleSaveSpeechNote}
                disabled={isSaving || !text.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 transition flex items-center gap-1.5 disabled:opacity-40"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#00D9FF]" />
                )}
                <span>Save Notes</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {saveSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {playerError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{playerError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
