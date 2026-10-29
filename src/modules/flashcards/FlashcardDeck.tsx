import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  Trash2,
  Edit2,
  Filter,
  Search,
  Sparkles,
  HelpCircle,
  X,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Flashcard } from '../../types';

export const FlashcardDeck: React.FC = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Study Mode State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [subject, setSubject] = useState('Operating Systems');
  const [topic, setTopic] = useState('Virtual Memory');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const loadCards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getFlashcards(user.id);
      setCards(data);
    } catch (err) {
      console.error('Error loading flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [user]);

  // Unique Subjects for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => set.add(c.subject));
    return Array.from(set);
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch =
        c.question.toLowerCase().includes(search.toLowerCase()) ||
        c.answer.toLowerCase().includes(search.toLowerCase()) ||
        (c.topic && c.topic.toLowerCase().includes(search.toLowerCase()));
      const matchSubject = selectedSubject === 'all' || c.subject === selectedSubject;
      const matchDiff = selectedDifficulty === 'all' || c.difficulty === selectedDifficulty;
      return matchSearch && matchSubject && matchDiff;
    });
  }, [cards, search, selectedSubject, selectedDifficulty]);

  // Launch Study Mode
  const handleStartStudy = () => {
    if (filteredCards.length === 0) return;
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setStudyComplete(false);
    setIsStudyMode(true);
  };

  // Spaced-Repetition Feedback Action
  const handleRating = async (rating: 'easy' | 'good' | 'hard') => {
    if (!user || filteredCards.length === 0) return;
    const currentCard = filteredCards[currentCardIndex];

    try {
      await apiService.recordFlashcardReview(user.id, currentCard.id, rating);

      // Advance to next card or complete
      if (currentCardIndex + 1 < filteredCards.length) {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentCardIndex((idx) => idx + 1);
      } else {
        setStudyComplete(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // fallback if canvas not available
        }
      }
      await loadCards();
    } catch (err) {
      console.error('Error recording flashcard review:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCard(null);
    setSubject(subjectsList[0] || 'Operating Systems');
    setTopic('');
    setQuestion('');
    setAnswer('');
    setHint('');
    setDifficulty('medium');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Flashcard) => {
    setEditingCard(c);
    setSubject(c.subject);
    setTopic(c.topic || '');
    setQuestion(c.question);
    setAnswer(c.answer);
    setHint(c.hint || '');
    setDifficulty(c.difficulty);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !question.trim() || !answer.trim()) return;

    try {
      await apiService.saveFlashcard(user.id, {
        id: editingCard?.id,
        subject,
        topic,
        question: question.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
        difficulty,
      });
      setIsModalOpen(false);
      await loadCards();
    } catch (err) {
      console.error('Error saving flashcard:', err);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('Delete this flashcard?')) return;
    try {
      await apiService.deleteFlashcard(id);
      await loadCards();
    } catch (err) {
      console.error('Error deleting flashcard:', err);
    }
  };

  const currentStudyCard = filteredCards[currentCardIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Flashcards & Spaced Repetition
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Practice active recall for course definitions, formulas, and algorithms with interactive flip cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredCards.length > 0 && !isStudyMode && (
            <button
              onClick={handleStartStudy}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-glow-violet transition flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Study Session ({filteredCards.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl glass-panel text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Card</span>
          </button>
        </div>
      </div>

      {/* ACTIVE STUDY MODE VIEWPORT */}
      {isStudyMode && currentStudyCard && !studyComplete && (
        <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 shadow-2xl space-y-6 max-w-2xl mx-auto animate-in zoom-in-95">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-purple-300">
              Card {currentCardIndex + 1} of {filteredCards.length}
            </span>
            <button
              onClick={() => setIsStudyMode(false)}
              className="text-slate-400 hover:text-white transition"
            >
              Exit Study Mode
            </button>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300"
              style={{
                width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%`,
              }}
            />
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 cursor-pointer min-h-[260px] w-full"
          >
            <div
              className={`relative w-full min-h-[260px] rounded-2xl transform-style-3d transition-transform duration-500 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Card Front: Question */}
              <div className="absolute inset-0 backface-hidden p-8 rounded-2xl bg-gradient-to-br from-[#0c152a] via-[#111e3b] to-[#142345] border border-cyan-500/30 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                    {currentStudyCard.subject} • {currentStudyCard.topic || 'Concept'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Click to Reveal Answer</span>
                  </span>
                </div>

                <div className="my-auto py-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">
                    QUESTION
                  </span>
                  <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {currentStudyCard.question}
                  </p>
                </div>

                {currentStudyCard.hint && (
                  <div className="pt-2 text-xs text-slate-400">
                    {showHint ? (
                      <span className="text-amber-300">💡 Hint: {currentStudyCard.hint}</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(true);
                        }}
                        className="text-amber-400 hover:underline"
                      >
                        Need a hint?
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card Back: Answer */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 rounded-2xl bg-gradient-to-br from-[#12142f] via-[#1a1744] to-[#221c54] border border-purple-500/40 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-slate-700">
                    {currentStudyCard.subject}
                  </span>
                  <span className="text-xs text-purple-300 font-mono">Answer Revealed</span>
                </div>

                <div className="my-auto py-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-purple-300 block mb-2">
                    ANSWER
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 whitespace-pre-line leading-relaxed font-sans">
                    {currentStudyCard.answer}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Reviewed {currentStudyCard.times_reviewed} times
                </div>
              </div>
            </div>
          </div>

          {/* Spaced-Repetition Feedback Controls */}
          {isFlipped && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <p className="text-center text-xs text-slate-400 font-medium">
                How well did you know this concept?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleRating('hard')}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
                >
                  Hard (Repeat Soon)
                </button>
                <button
                  onClick={() => handleRating('good')}
                  className="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
                >
                  Good (Recall Normal)
                </button>
                <button
                  onClick={() => handleRating('easy')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
                >
                  Easy (Mastered)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Study Session Complete Screen */}
      {isStudyMode && studyComplete && (
        <div className="p-8 rounded-2xl glass-panel border border-emerald-500/30 max-w-lg mx-auto text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center ring-4 ring-emerald-500/10">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Study Session Completed!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Great job! You have reviewed all {filteredCards.length} flashcards in this deck. Your spaced-repetition accuracy counters have been saved to your student account.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsStudyMode(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-glow-cyan hover:opacity-95 transition"
            >
              Return to Deck Library
            </button>
          </div>
        </div>
      )}

      {/* CARD LIBRARY & SEARCH/FILTER BAR */}
      {!isStudyMode && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search flashcards, topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass-input"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-xs"
              >
                <option value="all" className="bg-slate-900 text-white">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-xs"
              >
                <option value="all" className="bg-slate-900 text-white">All Difficulties</option>
                <option value="easy" className="bg-slate-900 text-white">Easy</option>
                <option value="medium" className="bg-slate-900 text-white">Medium</option>
                <option value="hard" className="bg-slate-900 text-white">Hard</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500">
                <p className="text-sm">No flashcards matching your criteria.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-2 text-xs text-purple-400 hover:underline"
                >
                  Create your first question card
                </button>
              </div>
            ) : (
              filteredCards.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-purple-500/30 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                        {c.subject}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          c.difficulty === 'hard'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : c.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        {c.difficulty}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                      {c.question}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                      {c.answer}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-500">
                      Reviewed: {c.times_reviewed}x ({c.times_reviewed > 0 ? Math.round((c.times_correct / c.times_reviewed) * 100) : 0}% acc)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                        title="Edit Card"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add / Edit Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-purple-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingCard ? 'Edit Flashcard' : 'Create New Q&A Flashcard'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Topic / Chapter</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Virtual Memory"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Question / Prompt</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What is Belady's Anomaly?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Answer / Explanation</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed answer or derivation..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-y font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Hint (Optional)</label>
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Brief memory aid"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="easy" className="bg-slate-900 text-white">Easy</option>
                    <option value="medium" className="bg-slate-900 text-white">Medium</option>
                    <option value="hard" className="bg-slate-900 text-white">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-glow-violet transition"
                >
                  {editingCard ? 'Update Card' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
