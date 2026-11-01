import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  Check,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  BookOpen,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  Sparkles,
  HelpCircle,
  Brain,
  Filter,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Flashcard, FlashcardDeck as DeckType, FlashcardReview } from '../../types';
import {
  generateFlashcardsFromPdf,
  validatePdfFile,
  GeneratedCard,
} from '../../services/aiFlashcardService';

type ViewMode = 'dashboard' | 'create_deck' | 'edit_deck' | 'manage_cards' | 'pdf_wizard' | 'review' | 'completion';

export const FlashcardDeck: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'guest_user';

  // Core Data
  const [decks, setDecks] = useState<DeckType[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Active View
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  // Manual Deck Create / Edit Form
  const [deckFormTitle, setDeckFormTitle] = useState('');
  const [deckFormSubject, setDeckFormSubject] = useState('');
  const [deckFormDesc, setDeckFormDesc] = useState('');
  const [deckFormSaving, setDeckFormSaving] = useState(false);
  const [deckFormError, setDeckFormError] = useState<string | null>(null);

  // Manual Card Form (inside Manage Cards or Deck creation)
  const [cardFormQuestion, setCardFormQuestion] = useState('');
  const [cardFormAnswer, setCardFormAnswer] = useState('');
  const [cardFormHint, setCardFormHint] = useState('');
  const [cardFormDifficulty, setCardFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFormSaving, setCardFormSaving] = useState(false);
  const [cardFormError, setCardFormError] = useState<string | null>(null);

  // PDF Generator Wizard State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragActive, setPdfDragActive] = useState(false);
  const [pdfDeckTitle, setPdfDeckTitle] = useState('');
  const [pdfSubject, setPdfSubject] = useState('Computer Science');
  const [pdfCardCount, setPdfCardCount] = useState<number>(10);
  const [pdfDifficulty, setPdfDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [pdfLanguage, setPdfLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfProgressStep, setPdfProgressStep] = useState('');
  const [pdfProgressPercent, setPdfProgressPercent] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [pdfSavingToDb, setPdfSavingToDb] = useState(false);

  // Interactive Review Mode State
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isWeakOnlyReview, setIsWeakOnlyReview] = useState(false);
  const [sessionKnownCount, setSessionKnownCount] = useState(0);
  const [sessionRevisionCount, setSessionRevisionCount] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Data Loading
  // ---------------------------------------------------------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [fetchedDecks, fetchedCards, fetchedReviews] = await Promise.all([
        apiService.getDecks(currentUserId),
        apiService.getFlashcards(currentUserId),
        apiService.getFlashcardReviews(currentUserId),
      ]);
      setDecks(fetchedDecks || []);
      setFlashcards(fetchedCards || []);
      setReviews(fetchedReviews || []);
    } catch (err) {
      console.error('Error fetching flashcard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUserId]);

  // ---------------------------------------------------------------------------
  // Status & Progress Calculations
  // ---------------------------------------------------------------------------
  // Card ID -> latest review status mapping
  const cardStatusMap = useMemo(() => {
    const map = new Map<string, 'known' | 'revision'>();
    // reviews are sorted or we iterate; latest takes precedence
    reviews.forEach((r) => {
      if (r.card_id && r.status) {
        map.set(r.card_id, r.status);
      }
    });
    return map;
  }, [reviews]);

  // Overall Global KPI Statistics
  const globalStats = useMemo(() => {
    const totalDecks = decks.length;
    const totalCards = flashcards.length;
    let totalKnown = 0;
    let totalRevision = 0;

    flashcards.forEach((c) => {
      const st = cardStatusMap.get(c.id);
      if (st === 'known') totalKnown++;
      else if (st === 'revision') totalRevision++;
    });

    const notReviewed = Math.max(0, totalCards - totalKnown - totalRevision);
    const overallPercentage = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;

    return {
      totalDecks,
      totalCards,
      totalKnown,
      totalRevision,
      notReviewed,
      overallPercentage,
    };
  }, [decks, flashcards, cardStatusMap]);

  // Deck Specific Statistics Helper
  const getDeckStats = (deckId: string) => {
    const deckCards = flashcards.filter((c) => c.deck_id === deckId);
    const total = deckCards.length;
    let known = 0;
    let revision = 0;
    deckCards.forEach((c) => {
      const st = cardStatusMap.get(c.id);
      if (st === 'known') known++;
      else if (st === 'revision') revision++;
    });
    const reviewed = known + revision;
    const completionRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    const masteryRate = total > 0 ? Math.round((known / total) * 100) : 0;
    return { total, known, revision, reviewed, completionRate, masteryRate };
  };

  // Distinct subjects list for filter pills
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    decks.forEach((d) => {
      if (d.subject?.trim()) set.add(d.subject.trim());
    });
    return Array.from(set);
  }, [decks]);

  // Filtered Decks List
  const filteredDecks = useMemo(() => {
    return decks.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.subject && d.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSubject =
        selectedSubjectFilter === 'all' ||
        (d.subject && d.subject.toLowerCase() === selectedSubjectFilter.toLowerCase());

      return matchSearch && matchSubject;
    });
  }, [decks, searchQuery, selectedSubjectFilter]);

  // ---------------------------------------------------------------------------
  // Keyboard Shortcuts for Review Mode
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (view !== 'review' || reviewCards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1' || e.code === 'Digit1') {
        e.preventDefault();
        handleReviewDecision('known');
      } else if (e.key === '2' || e.code === 'Digit2') {
        e.preventDefault();
        handleReviewDecision('revision');
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHint((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isFlipped, reviewCards, currentReviewIndex, reviewSubmitting]);

  // ---------------------------------------------------------------------------
  // Action Handlers: Manual Deck Creation & Editing
  // ---------------------------------------------------------------------------
  const handleOpenCreateDeck = () => {
    setDeckFormTitle('');
    setDeckFormSubject('');
    setDeckFormDesc('');
    setDeckFormError(null);
    setSelectedDeckId(null);
    setView('create_deck');
  };

  const handleOpenEditDeck = (deck: DeckType) => {
    setSelectedDeckId(deck.id);
    setDeckFormTitle(deck.title);
    setDeckFormSubject(deck.subject || '');
    setDeckFormDesc(deck.description || '');
    setDeckFormError(null);
    setView('edit_deck');
  };

  const handleSaveDeckForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckFormTitle.trim()) {
      setDeckFormError('Deck Title is required.');
      return;
    }
    setDeckFormSaving(true);
    setDeckFormError(null);

    try {
      const saved = await apiService.saveDeck(currentUserId, {
        id: selectedDeckId || undefined,
        title: deckFormTitle.trim(),
        subject: deckFormSubject.trim() || undefined,
        description: deckFormDesc.trim() || undefined,
      });

      if (saved) {
        await loadAllData();
        setView('dashboard');
      }
    } catch (err: any) {
      setDeckFormError(err.message || 'Failed to save deck.');
    } finally {
      setDeckFormSaving(false);
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this deck and all of its flashcards permanently?')) return;
    try {
      await apiService.deleteDeck(deckId);
      await loadAllData();
    } catch (err: any) {
      alert('Error deleting deck: ' + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers: Manage Deck Cards
  // ---------------------------------------------------------------------------
  const handleOpenManageCards = (deckId: string) => {
    setSelectedDeckId(deckId);
    resetCardForm();
    setView('manage_cards');
  };

  const resetCardForm = () => {
    setEditingCardId(null);
    setCardFormQuestion('');
    setCardFormAnswer('');
    setCardFormHint('');
    setCardFormDifficulty('medium');
    setCardFormError(null);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId) return;
    if (!cardFormQuestion.trim() || !cardFormAnswer.trim()) {
      setCardFormError('Question and Answer are required fields.');
      return;
    }

    setCardFormSaving(true);
    setCardFormError(null);

    try {
      const targetDeck = decks.find((d) => d.id === selectedDeckId);
      await apiService.saveFlashcard(currentUserId, {
        id: editingCardId || undefined,
        deck_id: selectedDeckId,
        subject: targetDeck?.subject || 'General',
        topic: targetDeck?.title || '',
        question: cardFormQuestion.trim(),
        answer: cardFormAnswer.trim(),
        hint: cardFormHint.trim() || undefined,
        difficulty: cardFormDifficulty,
      });

      await loadAllData();
      resetCardForm();
    } catch (err: any) {
      setCardFormError(err.message || 'Failed to save card.');
    } finally {
      setCardFormSaving(false);
    }
  };

  const handleEditCardClick = (card: Flashcard) => {
    setEditingCardId(card.id);
    setCardFormQuestion(card.question);
    setCardFormAnswer(card.answer);
    setCardFormHint(card.hint || '');
    setCardFormDifficulty(card.difficulty || 'medium');
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('Delete this flashcard?')) return;
    try {
      await apiService.deleteFlashcard(cardId);
      await loadAllData();
      if (editingCardId === cardId) {
        resetCardForm();
      }
    } catch (err: any) {
      alert('Failed to delete card: ' + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers: PDF Wizard Flow
  // ---------------------------------------------------------------------------
  const handleOpenPdfWizard = () => {
    setPdfFile(null);
    setPdfDeckTitle('');
    setPdfSubject('Computer Science');
    setPdfCardCount(10);
    setPdfDifficulty('mixed');
    setPdfLanguage('English');
    setPdfError(null);
    setGeneratedCards([]);
    setView('pdf_wizard');
  };

  const handleFileSelect = (file: File) => {
    const val = validatePdfFile(file);
    if (!val.valid) {
      setPdfError(val.error || 'Invalid PDF file.');
      return;
    }
    setPdfFile(file);
    setPdfError(null);
    // Autofill deck title from filename
    const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    setPdfDeckTitle(cleanName);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPdfDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRunAiGeneration = async () => {
    if (!pdfFile) {
      setPdfError('Please choose or drop an academic PDF file.');
      return;
    }
    if (!pdfDeckTitle.trim()) {
      setPdfError('Please provide a title for the generated deck.');
      return;
    }

    setPdfGenerating(true);
    setPdfError(null);
    setPdfProgressStep('Initializing document pipeline...');
    setPdfProgressPercent(5);

    try {
      const cards = await generateFlashcardsFromPdf(
        {
          file: pdfFile,
          count: pdfCardCount,
          difficulty: pdfDifficulty,
          language: pdfLanguage,
          deckTitle: pdfDeckTitle.trim(),
          subject: pdfSubject.trim(),
        },
        (step, pct) => {
          setPdfProgressStep(step);
          setPdfProgressPercent(pct);
        }
      );

      setGeneratedCards(cards);
    } catch (err: any) {
      console.error('AI PDF generation failed:', err);
      setPdfError(err.message || 'Generation failed. Please verify file and retry.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleUpdateGeneratedCard = (index: number, field: keyof GeneratedCard, value: any) => {
    setGeneratedCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteGeneratedCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPreviewCard = () => {
    setGeneratedCards((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        question: 'New Question Prompt',
        answer: 'New Key Answer',
        hint: 'Helpful clue',
        difficulty: 'medium',
      },
    ]);
  };

  const handleSaveGeneratedDeckToDb = async () => {
    if (generatedCards.length === 0) {
      setPdfError('No cards to save. Please generate cards first.');
      return;
    }
    setPdfSavingToDb(true);
    setPdfError(null);

    try {
      // 1. Create the Deck
      const createdDeck = await apiService.saveDeck(currentUserId, {
        title: pdfDeckTitle.trim(),
        subject: pdfSubject.trim() || undefined,
        description: `Generated from PDF: ${pdfFile?.name || 'Academic Material'} (${generatedCards.length} cards)`,
      });

      // 2. Insert all generated cards linked to deck_id
      const cardsToInsert = generatedCards.map((c) => ({
        deck_id: createdDeck.id,
        subject: pdfSubject.trim() || 'General',
        topic: pdfDeckTitle.trim(),
        question: c.question.trim(),
        answer: c.answer.trim(),
        hint: c.hint?.trim() || undefined,
        difficulty: c.difficulty,
      }));

      await apiService.saveFlashcardsBatch(currentUserId, cardsToInsert);
      await loadAllData();

      // Trigger celebration
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      setView('dashboard');
    } catch (err: any) {
      console.error('Error saving generated deck to database:', err);
      setPdfError(err.message || 'Failed to save generated deck to database.');
    } finally {
      setPdfSavingToDb(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers: Interactive Review Mode
  // ---------------------------------------------------------------------------
  const handleStartReview = (deckId: string, weakOnly = false) => {
    const deckCards = flashcards.filter((c) => c.deck_id === deckId);
    if (deckCards.length === 0) {
      alert('This deck has no cards yet. Add cards or generate some from a PDF!');
      return;
    }

    let cardsToReview = deckCards;
    if (weakOnly) {
      cardsToReview = deckCards.filter((c) => cardStatusMap.get(c.id) === 'revision');
      if (cardsToReview.length === 0) {
        alert('🎉 No cards in this deck need revision! All are mastered.');
        return;
      }
    }

    setSelectedDeckId(deckId);
    setReviewCards(cardsToReview);
    setCurrentReviewIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsWeakOnlyReview(weakOnly);
    setSessionKnownCount(0);
    setSessionRevisionCount(0);
    setView('review');
  };

  const handleNextCard = () => {
    if (currentReviewIndex < reviewCards.length - 1) {
      setCurrentReviewIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      finishReviewSession();
    }
  };

  const handlePrevCard = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleReviewDecision = async (status: 'known' | 'revision') => {
    if (reviewSubmitting || reviewCards.length === 0) return;
    const card = reviewCards[currentReviewIndex];
    if (!card) return;

    setReviewSubmitting(true);
    try {
      // 1. Record single review state in Supabase / LocalStore
      await apiService.recordFlashcardReview(currentUserId, card.id, status);

      // 2. Track in-memory session stats
      if (status === 'known') {
        setSessionKnownCount((prev) => prev + 1);
      } else {
        setSessionRevisionCount((prev) => prev + 1);
      }

      // Update local state map immediately for live reactivity
      setReviews((prev) => [
        {
          id: `rev_${Date.now()}`,
          user_id: currentUserId,
          card_id: card.id,
          status,
          reviewed_at: new Date().toISOString(),
        },
        ...prev.filter((r) => r.card_id !== card.id),
      ]);

      // Move to next card or complete
      if (currentReviewIndex < reviewCards.length - 1) {
        setCurrentReviewIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else {
        finishReviewSession();
      }
    } catch (err) {
      console.error('Error recording review status:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const finishReviewSession = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#00D9FF', '#087BFF', '#713CFF', '#00D6B5'],
    });
    setView('completion');
  };

  // ---------------------------------------------------------------------------
  // VIEW: COMPLETION SCREEN
  // ---------------------------------------------------------------------------
  if (view === 'completion') {
    const totalSessionCards = reviewCards.length;
    const activeDeck = decks.find((d) => d.id === selectedDeckId);
    const retentionRate =
      totalSessionCards > 0 ? Math.round((sessionKnownCount / totalSessionCards) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#071B35] border border-[#17365C] shadow-2xl text-center space-y-8 relative overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-[#00D9FF]/20 to-[#713CFF]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Trophy Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#087BFF] to-[#00D9FF] p-0.5 shadow-[0_0_40px_rgba(0,217,255,0.3)]">
            <div className="w-full h-full bg-[#061329] rounded-[22px] flex items-center justify-center">
              <Award className="w-10 h-10 text-[#00D9FF] animate-bounce" />
            </div>
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#00D9FF] px-3 py-1 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20">
              Session Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F4F7FF] mt-3">
              Outstanding Work!
            </h2>
            <p className="text-sm text-[#9BAFCB] mt-1">
              You reviewed <span className="text-white font-semibold">{totalSessionCards} cards</span> in{' '}
              <span className="text-[#00D9FF] font-semibold">{activeDeck?.title || 'this deck'}</span>.
            </p>
          </div>

          {/* Session Statistics Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#030E1F] border border-[#17365C]">
            <div className="p-3 text-center">
              <p className="text-2xl font-black text-[#00D9FF]">{totalSessionCards}</p>
              <p className="text-[11px] font-medium text-[#9BAFCB] uppercase mt-1">Reviewed</p>
            </div>
            <div className="p-3 text-center border-x border-[#17365C]">
              <p className="text-2xl font-black text-emerald-400">{sessionKnownCount}</p>
              <p className="text-[11px] font-medium text-[#9BAFCB] uppercase mt-1">Known</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{sessionRevisionCount}</p>
              <p className="text-[11px] font-medium text-[#9BAFCB] uppercase mt-1">Need Revision</p>
            </div>
          </div>

          {/* Accuracy Score Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#071B35] border border-[#00D9FF]/30 text-xs text-[#F4F7FF]">
            <TrendingUp className="w-4 h-4 text-[#00D9FF]" />
            <span>
              Session Retention Rate: <strong className="text-[#00D9FF] font-mono">{retentionRate}%</strong>
            </span>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {sessionRevisionCount > 0 && (
              <button
                type="button"
                onClick={() => selectedDeckId && handleStartReview(selectedDeckId, true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Practice Weak Cards ({sessionRevisionCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => selectedDeckId && handleStartReview(selectedDeckId, false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#061830] border border-[#17365C] hover:border-[#00D9FF]/40 transition flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4 text-[#00D9FF]" />
              <span>Restart Full Deck</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loadAllData();
                setView('dashboard');
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-[#087BFF]/20"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: INTERACTIVE 3D REVIEW MODE
  // ---------------------------------------------------------------------------
  if (view === 'review') {
    const totalCards = reviewCards.length;
    const currentCard = reviewCards[currentReviewIndex];
    const progressPercent = totalCards > 0 ? Math.round(((currentReviewIndex + 1) / totalCards) * 100) : 0;
    const activeDeck = decks.find((d) => d.id === selectedDeckId);
    const existingStatus = currentCard ? cardStatusMap.get(currentCard.id) : undefined;

    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in duration-200">
        {/* Top Header & Session Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              loadAllData();
              setView('dashboard');
            }}
            className="flex items-center gap-2 text-xs font-medium text-[#9BAFCB] hover:text-[#00D9FF] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit Review</span>
          </button>

          <div className="text-center">
            <h3 className="text-sm font-bold text-[#F4F7FF] flex items-center gap-2">
              <span>{activeDeck?.title || 'Flashcards'}</span>
              {isWeakOnlyReview && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Weak Cards Mode
                </span>
              )}
            </h3>
            <p className="text-[11px] font-mono text-[#9BAFCB] mt-0.5">
              Card {currentReviewIndex + 1} of {totalCards} ({progressPercent}%)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {sessionKnownCount}
            </span>
            <span className="text-[#17365C]">|</span>
            <span className="text-amber-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              {sessionRevisionCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#061830] border border-[#17365C] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#087BFF] to-[#00D9FF] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 3D Flip Card Container */}
        {currentCard ? (
          <div className="perspective-1000 min-h-[380px] w-full">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full min-h-[380px] rounded-3xl cursor-pointer transition-transform duration-500 transform-style-3d select-none ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD (Question) */}
              <div className="absolute inset-0 backface-hidden p-8 rounded-3xl bg-[#071B35] border border-[#17365C] hover:border-[#00D9FF]/40 shadow-2xl flex flex-col justify-between transition-colors">
                {/* Card Top Meta */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                    Question • Front
                  </span>
                  <div className="flex items-center gap-2">
                    {currentCard.difficulty && (
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                          currentCard.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : currentCard.difficulty === 'hard'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {currentCard.difficulty}
                      </span>
                    )}
                    {existingStatus && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          existingStatus === 'known'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        Previously: {existingStatus === 'known' ? 'Known' : 'Revision'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="my-auto py-6 text-center space-y-4">
                  <h4 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] leading-relaxed">
                    {currentCard.question}
                  </h4>
                  {showHint && currentCard.hint && (
                    <div className="p-3 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-xs text-[#00D9FF] max-w-md mx-auto animate-in fade-in">
                      💡 <strong>Hint:</strong> {currentCard.hint}
                    </div>
                  )}
                </div>

                {/* Card Bottom Clue */}
                <div className="flex items-center justify-between text-xs text-[#9BAFCB] border-t border-[#17365C]/60 pt-4">
                  {currentCard.hint ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className="text-[11px] font-mono text-[#00D9FF] hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showHint ? 'Hide Hint' : 'Show Hint (H)'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-[#9BAFCB]/60">Academic Concept</span>
                  )}
                  <span className="text-[11px] font-mono text-[#9BAFCB]/70">
                    Click card or press <kbd className="px-1.5 py-0.5 rounded bg-[#061830] border border-[#17365C] text-white">Space</kbd> to flip
                  </span>
                </div>
              </div>

              {/* BACK OF CARD (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 rounded-3xl bg-[#061830] border border-[#00D9FF]/50 shadow-2xl flex flex-col justify-between">
                {/* Back Top Meta */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Answer • Back
                  </span>
                  <span className="text-[11px] font-mono text-[#9BAFCB]">
                    {currentCard.topic || activeDeck?.title}
                  </span>
                </div>

                {/* Answer Content */}
                <div className="my-auto py-6 text-center space-y-4 max-w-xl mx-auto">
                  <p className="text-base sm:text-lg text-[#F4F7FF] leading-relaxed font-medium">
                    {currentCard.answer}
                  </p>
                </div>

                {/* Back Bottom Note */}
                <div className="flex items-center justify-between text-xs text-[#9BAFCB] border-t border-[#17365C]/60 pt-4">
                  <span className="text-[11px] font-mono text-[#9BAFCB]">SANKALP Knowledge Vault</span>
                  <span className="text-[11px] font-mono text-[#9BAFCB]/70">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-[#071B35] border border-[#17365C] text-white">1</kbd> for Known, <kbd className="px-1.5 py-0.5 rounded bg-[#071B35] border border-[#17365C] text-white">2</kbd> for Revision
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-[#9BAFCB]">No cards available in this deck.</div>
        )}

        {/* Core Review Decision Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Previous Card */}
          <button
            type="button"
            onClick={handlePrevCard}
            disabled={currentReviewIndex === 0}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9BAFCB] bg-[#071B35] border border-[#17365C] hover:text-white disabled:opacity-30 transition flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Decision Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            {/* NEED REVISION BUTTON */}
            <button
              type="button"
              disabled={reviewSubmitting}
              onClick={() => handleReviewDecision('revision')}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl text-xs font-bold text-amber-200 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>Need Revision (2)</span>
            </button>

            {/* I KNOW THIS BUTTON */}
            <button
              type="button"
              disabled={reviewSubmitting}
              onClick={() => handleReviewDecision('known')}
              className="flex-1 sm:flex-initial px-7 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>I Know This (1)</span>
            </button>
          </div>

          {/* Next Card */}
          <button
            type="button"
            onClick={handleNextCard}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9BAFCB] bg-[#071B35] border border-[#17365C] hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <span>{currentReviewIndex === totalCards - 1 ? 'Finish' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: PDF TO FLASHCARDS GENERATOR WIZARD
  // ---------------------------------------------------------------------------
  if (view === 'pdf_wizard') {
    return (
      <div className="max-w-4xl mx-auto py-4 space-y-6 animate-in fade-in duration-200">
        {/* Wizard Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-xs font-medium text-[#9BAFCB] hover:text-[#00D9FF] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Flashcards</span>
          </button>
          <span className="text-xs font-mono text-[#00D9FF] px-3 py-1 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
            AI Document Engine
          </span>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#071B35] border border-[#17365C] shadow-2xl space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
              AI PDF-to-Flashcards Generator
            </h2>
            <p className="text-xs text-[#9BAFCB] mt-1">
              Upload textbook chapters, syllabi, or lecture slides. Gemini 1.5 synthesizes high-yield exam cards with instant revision prompts.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setPdfDragActive(true);
            }}
            onDragLeave={() => setPdfDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              pdfDragActive
                ? 'border-[#00D9FF] bg-[#00D9FF]/5'
                : pdfFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-[#17365C] bg-[#030E1F]/60 hover:border-[#00D9FF]/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {pdfFile ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#061830] border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#F4F7FF] truncate max-w-xs sm:max-w-md">
                      {pdfFile.name}
                    </p>
                    <p className="text-xs font-mono text-[#9BAFCB]">
                      {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#9BAFCB] bg-[#030E1F] border border-[#17365C] hover:text-[#00D9FF] transition"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setGeneratedCards([]);
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#087BFF]/30 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F4F7FF]">
                    Click to browse or drag and drop your PDF here
                  </p>
                  <p className="text-xs text-[#9BAFCB] mt-1">
                    Supports academic PDFs up to 25MB (Lecture Notes, Textbooks, PPT Slides)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generation Options Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Deck Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Database Management Systems"
                value={pdfDeckTitle}
                onChange={(e) => setPdfDeckTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/40 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">Subject / Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                value={pdfSubject}
                onChange={(e) => setPdfSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/40 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">Number of Cards</label>
              <select
                value={pdfCardCount}
                onChange={(e) => setPdfCardCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition cursor-pointer"
              >
                <option value={5}>5 Cards (Quick Revision)</option>
                <option value={10}>10 Cards (Balanced Exam Prep)</option>
                <option value={15}>15 Cards (In-Depth Chapter)</option>
                <option value={20}>20 Cards (Comprehensive Mastery)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">Difficulty Focus</label>
              <select
                value={pdfDifficulty}
                onChange={(e) => setPdfDifficulty(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition cursor-pointer"
              >
                <option value="mixed">Mixed (Easy, Medium & Hard)</option>
                <option value="easy">Easy (Definitions & Foundational)</option>
                <option value="medium">Medium (Analytical & Algorithms)</option>
                <option value="hard">Hard (Proofs & Complex Architectures)</option>
              </select>
            </div>
          </div>

          {/* Progress Indicator */}
          {pdfGenerating && (
            <div className="p-5 rounded-2xl bg-[#030E1F] border border-[#00D9FF]/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#00D9FF] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pdfProgressStep}
                </span>
                <span className="text-[#F4F7FF] font-bold">{pdfProgressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#061830] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#087BFF] to-[#00D9FF] transition-all duration-300"
                  style={{ width: `${pdfProgressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {pdfError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{pdfError}</span>
            </div>
          )}

          {/* Trigger Generate Button */}
          {generatedCards.length === 0 && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleRunAiGeneration}
                disabled={pdfGenerating || !pdfFile}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-2 shadow-lg shadow-[#087BFF]/25 disabled:opacity-50"
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Flashcards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Flashcards from PDF</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* PRE-SAVE INTERACTIVE PREVIEW */}
          {generatedCards.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#17365C]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#F4F7FF] flex items-center gap-2">
                    <span>Generated Cards Preview</span>
                    <span className="text-xs font-mono text-[#00D9FF] px-2 py-0.5 rounded-md bg-[#00D9FF]/10">
                      {generatedCards.length} Cards
                    </span>
                  </h3>
                  <p className="text-xs text-[#9BAFCB]">
                    Review, edit questions/answers, or add custom cards before committing to your database.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddPreviewCard}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#00D9FF] bg-[#061830] border border-[#00D9FF]/30 hover:bg-[#00D9FF]/10 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRunAiGeneration}
                    disabled={pdfGenerating}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#9BAFCB] bg-[#061830] border border-[#17365C] hover:text-white transition flex items-center gap-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Cards List Preview */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {generatedCards.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-4 rounded-2xl bg-[#030E1F] border border-[#17365C] space-y-3 group hover:border-[#00D9FF]/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#9BAFCB]">Card #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={c.difficulty}
                          onChange={(e) =>
                            handleUpdateGeneratedCard(idx, 'difficulty', e.target.value as any)
                          }
                          className="text-[11px] font-mono px-2 py-1 rounded bg-[#061830] border border-[#17365C] text-[#00D9FF] focus:outline-none cursor-pointer"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteGeneratedCard(idx)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/15 transition"
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#9BAFCB] mb-1">
                        Question Prompt
                      </label>
                      <input
                        type="text"
                        value={c.question}
                        onChange={(e) => handleUpdateGeneratedCard(idx, 'question', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#9BAFCB] mb-1">
                        Answer & Key Points
                      </label>
                      <textarea
                        rows={2}
                        value={c.answer}
                        onChange={(e) => handleUpdateGeneratedCard(idx, 'answer', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#9BAFCB] mb-1">
                        Hint (Optional)
                      </label>
                      <input
                        type="text"
                        value={c.hint || ''}
                        onChange={(e) => handleUpdateGeneratedCard(idx, 'hint', e.target.value)}
                        placeholder="Memory clue"
                        className="w-full px-3 py-1 rounded-lg bg-[#061830] border border-[#17365C] text-[11px] text-[#9BAFCB] focus:outline-none focus:border-[#00D9FF] transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Commit to Database Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#17365C]">
                <button
                  type="button"
                  onClick={() => setView('dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9BAFCB] bg-[#030E1F] border border-[#17365C] hover:text-white transition"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveGeneratedDeckToDb}
                  disabled={pdfSavingToDb}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {pdfSavingToDb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Deck to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Deck & Cards ({generatedCards.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: CREATE / EDIT DECK FORM
  // ---------------------------------------------------------------------------
  if (view === 'create_deck' || view === 'edit_deck') {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-xs font-medium text-[#9BAFCB] hover:text-[#00D9FF] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Flashcards</span>
          </button>
          <span className="text-xs font-mono text-[#00D9FF]">
            {view === 'create_deck' ? 'New Deck' : 'Edit Deck'}
          </span>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#071B35] border border-[#17365C] shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#F4F7FF]">
              {view === 'create_deck' ? 'Create Flashcard Deck' : 'Edit Flashcard Deck'}
            </h2>
            <p className="text-xs text-[#9BAFCB] mt-1">
              Group your flashcards by subject or study module.
            </p>
          </div>

          <form onSubmit={handleSaveDeckForm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Deck Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Operating Systems: Memory Management"
                value={deckFormTitle}
                onChange={(e) => setDeckFormTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/40 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Subject (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={deckFormSubject}
                onChange={(e) => setDeckFormSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/40 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Core concepts including paging, segmentation, virtual memory, and page replacement algorithms."
                value={deckFormDesc}
                onChange={(e) => setDeckFormDesc(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-[#9BAFCB]/40 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            {deckFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deckFormError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#17365C]">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9BAFCB] bg-[#030E1F] border border-[#17365C] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deckFormSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-2 shadow-lg shadow-[#087BFF]/20 disabled:opacity-50"
              >
                {deckFormSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{view === 'create_deck' ? 'Create Deck' : 'Update Deck'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: MANAGE DECK CARDS
  // ---------------------------------------------------------------------------
  if (view === 'manage_cards') {
    const activeDeck = decks.find((d) => d.id === selectedDeckId);
    const deckCards = flashcards.filter((c) => c.deck_id === selectedDeckId);

    return (
      <div className="max-w-4xl mx-auto py-4 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-xs font-medium text-[#9BAFCB] hover:text-[#00D9FF] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Flashcards</span>
          </button>
          <div className="flex items-center gap-2">
            {deckCards.length > 0 && (
              <button
                type="button"
                onClick={() => selectedDeckId && handleStartReview(selectedDeckId)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Review</span>
              </button>
            )}
          </div>
        </div>

        {/* Deck Header Card */}
        <div className="p-6 rounded-3xl bg-[#071B35] border border-[#17365C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-md bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                {activeDeck?.subject || 'General'}
              </span>
              <h2 className="text-xl font-bold text-[#F4F7FF]">{activeDeck?.title}</h2>
            </div>
            {activeDeck?.description && (
              <p className="text-xs text-[#9BAFCB] mt-1.5">{activeDeck.description}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#00D9FF]">{deckCards.length}</span>
            <p className="text-[11px] font-mono text-[#9BAFCB] uppercase">Cards in Deck</p>
          </div>
        </div>

        {/* Add / Edit Card Form */}
        <div className="p-6 rounded-3xl bg-[#071B35] border border-[#17365C] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#17365C] pb-3">
            <h3 className="text-sm font-bold text-[#F4F7FF]">
              {editingCardId ? 'Edit Flashcard' : 'Add New Flashcard'}
            </h3>
            {editingCardId && (
              <button
                type="button"
                onClick={resetCardForm}
                className="text-xs text-[#00D9FF] hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Front: Question <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="What is the difference between paging and segmentation?"
                value={cardFormQuestion}
                onChange={(e) => setCardFormQuestion(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#061830] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Back: Answer <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Paging divides memory into fixed-size blocks (pages), while segmentation divides memory into variable-size logical units (segments)."
                value={cardFormAnswer}
                onChange={(e) => setCardFormAnswer(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#061830] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                  Hint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Fixed vs variable size"
                  value={cardFormHint}
                  onChange={(e) => setCardFormHint(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">Difficulty</label>
                <select
                  value={cardFormDifficulty}
                  onChange={(e) => setCardFormDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition cursor-pointer"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {cardFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cardFormError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={cardFormSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-2 shadow-lg shadow-[#087BFF]/20 disabled:opacity-50"
              >
                {cardFormSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Card...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingCardId ? 'Update Card' : 'Add Card to Deck'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Cards List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#9BAFCB] uppercase tracking-wider">
            Deck Cards ({deckCards.length})
          </h3>

          {deckCards.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#030E1F] border border-[#17365C] text-center text-[#9BAFCB] text-xs">
              No flashcards in this deck yet. Use the form above to add your first card.
            </div>
          ) : (
            <div className="space-y-2.5">
              {deckCards.map((card, idx) => {
                const status = cardStatusMap.get(card.id);
                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl bg-[#030E1F] border border-[#17365C] hover:border-[#00D9FF]/40 transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#00D9FF]">#{idx + 1}</span>
                        {card.difficulty && (
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                              card.difficulty === 'easy'
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : card.difficulty === 'hard'
                                ? 'bg-rose-500/10 text-rose-300'
                                : 'bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {card.difficulty}
                          </span>
                        )}
                        {status && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              status === 'known'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {status === 'known' ? '✓ Mastered' : '↺ Needs Revision'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCardClick(card)}
                          className="p-1 rounded text-[#9BAFCB] hover:text-[#00D9FF] transition"
                          title="Edit Card"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/15 transition"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-[#F4F7FF]">
                      <span className="text-[#9BAFCB] font-mono mr-1">Q:</span>
                      {card.question}
                    </p>
                    <p className="text-xs text-[#9BAFCB]">
                      <span className="text-emerald-400 font-mono mr-1">A:</span>
                      {card.answer}
                    </p>
                    {card.hint && (
                      <p className="text-[11px] font-mono text-[#00D9FF]/80">
                        💡 Hint: {card.hint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: MAIN DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#087BFF]/30 shadow-[0_0_20px_rgba(8,123,255,0.15)]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
              AI Flashcards & Spaced Revision
            </h1>
            <p className="text-xs text-[#9BAFCB]">
              Master university courses with 3D flashcards and Gemini PDF extraction.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenCreateDeck}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#071B35] border border-[#17365C] text-[#F4F7FF] hover:border-[#00D9FF]/50 hover:text-[#00D9FF] transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#00D9FF]" />
            <span>Create Deck</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPdfWizard}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5 shadow-lg shadow-[#087BFF]/20"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Generate from PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Decks */}
        <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BAFCB]">Total Decks</span>
            <BookOpen className="w-4 h-4 text-[#00D9FF]" />
          </div>
          <p className="text-2xl font-black text-[#F4F7FF] mt-2 font-mono">
            {globalStats.totalDecks}
          </p>
          <p className="text-[11px] text-[#9BAFCB] mt-1">Organized study modules</p>
        </div>

        {/* Total Flashcards */}
        <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BAFCB]">Total Flashcards</span>
            <Layers className="w-4 h-4 text-[#087BFF]" />
          </div>
          <p className="text-2xl font-black text-[#00D9FF] mt-2 font-mono">
            {globalStats.totalCards}
          </p>
          <p className="text-[11px] text-[#9BAFCB] mt-1">High-yield revision cards</p>
        </div>

        {/* Cards to Revise */}
        <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BAFCB]">Cards to Revise</span>
            <RotateCw className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
            {globalStats.totalRevision}
          </p>
          <p className="text-[11px] text-[#9BAFCB] mt-1">Marked for revision</p>
        </div>

        {/* Mastered / Known Cards */}
        <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BAFCB]">Mastered Cards</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {globalStats.totalKnown}
          </p>
          <p className="text-[11px] text-[#9BAFCB] mt-1">
            {globalStats.overallPercentage}% overall retention
          </p>
        </div>
      </div>

      {/* Search Bar & Subject Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9BAFCB]" />
          <input
            type="text"
            placeholder="Search decks by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#071B35] border border-[#17365C] text-xs sm:text-sm text-[#F4F7FF] placeholder-[#9BAFCB]/50 focus:outline-none focus:border-[#00D9FF] transition"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              selectedSubjectFilter === 'all'
                ? 'bg-[#00D9FF] text-[#020B1A] font-bold'
                : 'bg-[#071B35] text-[#9BAFCB] border border-[#17365C] hover:text-[#F4F7FF]'
            }`}
          >
            All Decks ({decks.length})
          </button>
          {subjectsList.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubjectFilter(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedSubjectFilter === sub
                  ? 'bg-[#00D9FF] text-[#020B1A] font-bold'
                  : 'bg-[#071B35] text-[#9BAFCB] border border-[#17365C] hover:text-[#F4F7FF]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* DECKS GRID */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-[#00D9FF] animate-spin" />
          <p className="text-xs text-[#9BAFCB]">Loading flashcards & revision progress...</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#071B35] border border-[#17365C] text-center space-y-4">
          <Layers className="w-12 h-12 mx-auto text-[#17365C]" />
          <div>
            <h3 className="text-base font-bold text-[#F4F7FF]">No Flashcard Decks Found</h3>
            <p className="text-xs text-[#9BAFCB] max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No decks matched "${searchQuery}". Clear your search or try another term.`
                : 'Get started by creating your first manual deck or generating one automatically from a lecture PDF.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenCreateDeck}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#F4F7FF] bg-[#061830] border border-[#17365C] hover:border-[#00D9FF]/40 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Create Deck Manually</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPdfWizard}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate from PDF</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => {
            const stats = getDeckStats(deck.id);

            return (
              <div
                key={deck.id}
                className="p-6 rounded-3xl bg-[#071B35] border border-[#17365C] hover:border-[#00D9FF]/40 transition-all shadow-xl flex flex-col justify-between space-y-4 group"
              >
                {/* Deck Card Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                      {deck.subject || 'General'}
                    </span>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => handleOpenManageCards(deck.id)}
                        className="p-1 rounded text-[#9BAFCB] hover:text-[#00D9FF] transition"
                        title="Manage Cards"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditDeck(deck)}
                        className="p-1 rounded text-[#9BAFCB] hover:text-[#00D9FF] transition"
                        title="Edit Deck Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/15 transition"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#F4F7FF] line-clamp-1">{deck.title}</h3>
                  {deck.description && (
                    <p className="text-xs text-[#9BAFCB] line-clamp-2">{deck.description}</p>
                  )}
                </div>

                {/* Status Breakdown & Progress Bar */}
                <div className="space-y-2 pt-2 border-t border-[#17365C]/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9BAFCB] font-mono">
                      {stats.total} {stats.total === 1 ? 'card' : 'cards'}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-emerald-400">✓ {stats.known}</span>
                      <span className="text-amber-400">↺ {stats.revision}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#061830] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#00D9FF] transition-all"
                      style={{ width: `${stats.masteryRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#9BAFCB] font-mono">
                    <span>Mastery: {stats.masteryRate}%</span>
                    <span>Reviewed: {stats.completionRate}%</span>
                  </div>
                </div>

                {/* Deck Card Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStartReview(deck.id, false)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-[#087BFF]/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Review</span>
                  </button>

                  {stats.revision > 0 && (
                    <button
                      type="button"
                      onClick={() => handleStartReview(deck.id, true)}
                      className="py-2 px-3 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center gap-1"
                      title="Practice only cards that need revision"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Weak ({stats.revision})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
