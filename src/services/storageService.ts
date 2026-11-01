import {
  StudentProfile,
  Budget,
  Expense,
  Subject,
  AttendanceRecord,
  Note,
  Diagram,
  Flashcard,
  FlashcardDeck,
  FlashcardReview,
  CodeSnippet,
  SafetyResource,
  SafetyReport,
  VerifiedSupportContact,
  SourceDocument,
  ExtractedTopic,
  SavedSpeechNote,
} from '../types';
import { sanitizeMermaid } from '../utils/mermaidSanitizer';

import {
  INITIAL_MOCK_USER,
  INITIAL_MOCK_BUDGET,
  INITIAL_MOCK_EXPENSES,
  INITIAL_MOCK_SUBJECTS,
  generateInitialMockAttendance,
  INITIAL_MOCK_NOTES,
  INITIAL_MOCK_DIAGRAMS,
  INITIAL_MOCK_FLASHCARDS,
  INITIAL_MOCK_DECKS,
  INITIAL_MOCK_CODE_SNIPPETS,
  INITIAL_MOCK_SAFETY,
} from './mockData';

const STORAGE_KEYS = {
  USER: 'sankalp_student_profile',
  BUDGET: 'sankalp_student_budget',
  EXPENSES: 'sankalp_student_expenses',
  SUBJECTS: 'sankalp_student_subjects',
  ATTENDANCE: 'sankalp_student_attendance',
  NOTES: 'sankalp_student_notes',
  DIAGRAMS: 'sankalp_student_diagrams',
  DECKS: 'sankalp_student_flashcard_decks',
  FLASHCARDS: 'sankalp_student_flashcards',
  FLASHCARD_REVIEWS: 'sankalp_student_flashcard_reviews',
  CODE_SNIPPETS: 'sankalp_student_code_snippets',
  SAFETY_RESOURCES: 'sankalp_safety_resources',
  SAFETY_REPORTS: 'sankalp_safety_reports',
  VERIFIED_SUPPORT_CONTACTS: 'sankalp_verified_support_contacts',
  IS_LOGGED_IN: 'sankalp_auth_logged_in',
  RATE_LIMITS: 'sankalp_student_rate_limits',
  SOURCE_DOCUMENTS: 'sankalp_source_documents',
  EXTRACTED_TOPICS: 'sankalp_extracted_topics',
  SPEECH_NOTES: 'sankalp_saved_speech_notes',
};

class LocalStorageService {
  constructor() {
    this.initializeIfEmpty();
  }

  private initializeIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_MOCK_USER));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BUDGET)) {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(INITIAL_MOCK_BUDGET));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_MOCK_EXPENSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_MOCK_SUBJECTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      const initialAttendance = generateInitialMockAttendance(INITIAL_MOCK_USER.id, INITIAL_MOCK_SUBJECTS);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_MOCK_NOTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIAGRAMS)) {
      localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(INITIAL_MOCK_DIAGRAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DECKS)) {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(INITIAL_MOCK_DECKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FLASHCARDS)) {
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(INITIAL_MOCK_FLASHCARDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FLASHCARD_REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.FLASHCARD_REVIEWS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CODE_SNIPPETS)) {
      localStorage.setItem(STORAGE_KEYS.CODE_SNIPPETS, JSON.stringify(INITIAL_MOCK_CODE_SNIPPETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SAFETY_RESOURCES)) {
      localStorage.setItem(STORAGE_KEYS.SAFETY_RESOURCES, JSON.stringify(INITIAL_MOCK_SAFETY));
    }
  }

  resetToMocks() {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_MOCK_USER));
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(INITIAL_MOCK_BUDGET));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_MOCK_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_MOCK_SUBJECTS));
    const initialAttendance = generateInitialMockAttendance(INITIAL_MOCK_USER.id, INITIAL_MOCK_SUBJECTS);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_MOCK_NOTES));
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(INITIAL_MOCK_DIAGRAMS));
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(INITIAL_MOCK_DECKS));
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(INITIAL_MOCK_FLASHCARDS));
    localStorage.setItem(STORAGE_KEYS.FLASHCARD_REVIEWS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CODE_SNIPPETS, JSON.stringify(INITIAL_MOCK_CODE_SNIPPETS));
    localStorage.setItem(STORAGE_KEYS.SAFETY_RESOURCES, JSON.stringify(INITIAL_MOCK_SAFETY));
  }

  // --- Profile ---
  getProfile(): StudentProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : INITIAL_MOCK_USER;
  }

  saveProfile(profile: Partial<StudentProfile>): StudentProfile {
    const current = this.getProfile();
    const updated = { ...current, ...profile, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  }

  // --- Expenses & Budget ---
  getExpenses(): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return raw ? JSON.parse(raw) : [];
  }

  addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Expense {
    const all = this.getExpenses();
    const newExp: Expense = {
      ...expense,
      id: 'exp_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    all.unshift(newExp);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
    return newExp;
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense {
    const all = this.getExpenses();
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    all[idx] = { ...all[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
    return all[idx];
  }

  deleteExpense(id: string): void {
    const all = this.getExpenses().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
  }

  getBudget(): Budget {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return raw ? JSON.parse(raw) : INITIAL_MOCK_BUDGET;
  }

  saveBudget(monthlyLimit: number): Budget {
    const current = this.getBudget();
    const updated: Budget = {
      ...current,
      monthly_limit: monthlyLimit,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(updated));
    return updated;
  }

  // --- Subjects & Attendance ---
  getSubjects(): Subject[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) return [];
    try {
      const parsed: Subject[] = JSON.parse(raw);
      return parsed.map(s => ({
        ...s,
        name: s.name || s.subject_name || 'Untitled Subject',
        subject_name: s.subject_name || s.name || 'Untitled Subject',
        code: s.code || s.subject_code || '',
        subject_code: s.subject_code || s.code || '',
      }));
    } catch {
      return [];
    }
  }

  addSubject(subject: Omit<Subject, 'id' | 'created_at'>): Subject {
    const all = this.getSubjects();
    const cleanName = (subject.name || subject.subject_name || '').trim();
    if (!cleanName) throw new Error('Subject name is required.');

    const exists = all.some(
      s => (s.name || s.subject_name || '').trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      throw new Error(`A subject named "${cleanName}" already exists.`);
    }

    const cleanCode = (subject.code || subject.subject_code || '').trim();
    const newSub: Subject = {
      ...subject,
      name: cleanName,
      subject_name: cleanName,
      code: cleanCode || undefined,
      subject_code: cleanCode || undefined,
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    all.push(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(all));
    return newSub;
  }

  updateSubject(id: string, updates: Partial<Subject>): Subject {
    const all = this.getSubjects();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subject not found');

    const cleanName = (updates.name || updates.subject_name || all[idx].name).trim();
    if (!cleanName) throw new Error('Subject name is required.');

    const exists = all.some(
      s => s.id !== id && (s.name || s.subject_name || '').trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      throw new Error(`Another subject named "${cleanName}" already exists.`);
    }

    const cleanCode = (updates.code !== undefined ? updates.code : (updates.subject_code !== undefined ? updates.subject_code : all[idx].code || '')).trim();

    all[idx] = {
      ...all[idx],
      ...updates,
      name: cleanName,
      subject_name: cleanName,
      code: cleanCode || undefined,
      subject_code: cleanCode || undefined,
    };
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(all));
    return all[idx];
  }

  deleteSubject(id: string): void {
    const all = this.getSubjects().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(all));
    // Also delete attendance records for this subject
    const attendance = this.getAttendance().filter(a => a.subject_id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }

  getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    try {
      const parsed: AttendanceRecord[] = JSON.parse(raw);
      return parsed.map(a => {
        const cleanDate = a.date || a.attendance_date || new Date().toISOString().split('T')[0];
        return {
          ...a,
          date: cleanDate,
          attendance_date: cleanDate,
          status: a.status || 'Present',
        };
      });
    } catch {
      return [];
    }
  }

  recordAttendance(record: Omit<AttendanceRecord, 'id' | 'created_at'>): AttendanceRecord {
    const all = this.getAttendance();
    const cleanDate = (record.date || record.attendance_date || new Date().toISOString().split('T')[0]).trim();
    const statusToSave = record.status || 'Present';

    // Validate uniqueness: duplicate attendance check for same subject and date!
    const existingIndex = all.findIndex(
      a => a.subject_id === record.subject_id && (a.date === cleanDate || a.attendance_date === cleanDate)
    );

    if (existingIndex !== -1) {
      // Update existing record
      all[existingIndex] = {
        ...all[existingIndex],
        status: statusToSave,
        notes: record.notes,
        date: cleanDate,
        attendance_date: cleanDate,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
      return all[existingIndex];
    }

    const newRecord: AttendanceRecord = {
      ...record,
      date: cleanDate,
      attendance_date: cleanDate,
      status: statusToSave,
      id: 'att_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
    return newRecord;
  }

  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): AttendanceRecord {
    const all = this.getAttendance();
    const idx = all.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Attendance record not found');

    const cleanDate = updates.date || updates.attendance_date || all[idx].date;
    const cleanStatus = updates.status
      ? (updates.status === 'Present' || updates.status === 'present' ? 'Present' : 'Absent')
      : all[idx].status;

    all[idx] = {
      ...all[idx],
      ...updates,
      date: cleanDate,
      attendance_date: cleanDate,
      status: cleanStatus,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
    return all[idx];
  }

  deleteAttendanceRecord(id: string): void {
    const all = this.getAttendance().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
  }

  // --- Notes ---
  getNotes(): Note[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    return raw ? JSON.parse(raw) : [];
  }

  saveNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Note {
    const all = this.getNotes();
    if (note.id) {
      const idx = all.findIndex(n => n.id === note.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...note,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(all));
        return all[idx];
      }
    }
    const newNote: Note = {
      ...note,
      id: 'note_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(newNote);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(all));
    return newNote;
  }

  deleteNote(id: string): void {
    const all = this.getNotes().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(all));
  }

  // --- Diagrams ---
  getDiagrams(): Diagram[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    if (!raw) return [];
    try {
      const parsed: Diagram[] = JSON.parse(raw);
      // Auto-sanitize any cached diagrams
      let changed = false;
      const cleaned = parsed.map(d => {
        const sanitized = sanitizeMermaid(d.mermaid_code || '');
        if (sanitized !== d.mermaid_code) {
          changed = true;
          return {
            ...d,
            mermaid_code: sanitized,
          };
        }
        return d;
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  saveDiagram(diagram: Omit<Diagram, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Diagram {
    const all = this.getDiagrams();
    const cleanCode = sanitizeMermaid(diagram.mermaid_code || '');
    if (diagram.id) {
      const idx = all.findIndex(d => d.id === diagram.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...diagram,
          mermaid_code: cleanCode,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(all));
        return all[idx];
      }
    }
    const newDiagram: Diagram = {
      ...diagram,
      mermaid_code: cleanCode,
      id: 'diag_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(newDiagram);
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(all));
    return newDiagram;
  }

  deleteDiagram(id: string): void {
    const all = this.getDiagrams().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(all));
  }

  // --- Flashcard Decks & Cards ---
  getDecks(): FlashcardDeck[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
    return raw ? JSON.parse(raw) : [];
  }

  saveDeck(deck: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'> & { id?: string }): FlashcardDeck {
    const all = this.getDecks();
    if (deck.id) {
      const idx = all.findIndex(d => d.id === deck.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...deck,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(all));
        return all[idx];
      }
    }
    const newDeck: FlashcardDeck = {
      ...deck,
      id: deck.id || 'deck_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(newDeck);
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(all));
    return newDeck;
  }

  deleteDeck(id: string): void {
    const remainingDecks = this.getDecks().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(remainingDecks));

    // Cascade delete cards in deck
    const remainingCards = this.getFlashcards().filter(c => c.deck_id !== id);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(remainingCards));
  }

  getFlashcards(deckId?: string): Flashcard[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    const all: Flashcard[] = raw ? JSON.parse(raw) : [];
    if (deckId) {
      return all.filter(c => c.deck_id === deckId);
    }
    return all;
  }

  saveFlashcard(card: Omit<Flashcard, 'id' | 'times_reviewed' | 'times_correct' | 'created_at'> & { id?: string }): Flashcard {
    const all = this.getFlashcards();
    if (card.id) {
      const idx = all.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...card,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
        return all[idx];
      }
    }
    const newCard: Flashcard = {
      ...card,
      id: card.id || 'fc_' + Math.random().toString(36).substring(2, 9),
      times_reviewed: 0,
      times_correct: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newCard);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
    return newCard;
  }

  saveFlashcardsBatch(cards: Array<Omit<Flashcard, 'id' | 'times_reviewed' | 'times_correct' | 'created_at'> & { id?: string }>): Flashcard[] {
    const all = this.getFlashcards();
    const savedList: Flashcard[] = [];

    for (const card of cards) {
      if (card.id) {
        const idx = all.findIndex(c => c.id === card.id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...card, updated_at: new Date().toISOString() };
          savedList.push(all[idx]);
          continue;
        }
      }
      const newCard: Flashcard = {
        ...card,
        id: card.id || 'fc_' + Math.random().toString(36).substring(2, 9),
        times_reviewed: 0,
        times_correct: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.push(newCard);
      savedList.push(newCard);
    }

    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
    return savedList;
  }

  getFlashcardReviews(userId?: string): FlashcardReview[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FLASHCARD_REVIEWS);
    const reviews: FlashcardReview[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      return reviews.filter(r => r.user_id === userId);
    }
    return reviews;
  }

  recordFlashcardReview(cardId: string, status: 'known' | 'revision', userId?: string): FlashcardReview {
    const effectiveUserId = userId || INITIAL_MOCK_USER.id;
    const allCards = this.getFlashcards();
    const cIdx = allCards.findIndex(c => c.id === cardId);
    if (cIdx !== -1) {
      allCards[cIdx].times_reviewed = (allCards[cIdx].times_reviewed || 0) + 1;
      if (status === 'known') {
        allCards[cIdx].times_correct = (allCards[cIdx].times_correct || 0) + 1;
      }
      allCards[cIdx].last_reviewed_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(allCards));
    }

    // Upsert review record: ensure 1 unique active review status per (user_id, card_id)
    const reviews = this.getFlashcardReviews();
    const existingIdx = reviews.findIndex(r => r.user_id === effectiveUserId && (r.card_id === cardId || r.flashcard_id === cardId));
    
    let activeReview: FlashcardReview;
    if (existingIdx !== -1) {
      activeReview = {
        ...reviews[existingIdx],
        status,
        rating: status === 'known' ? 'easy' : 'hard',
        reviewed_at: new Date().toISOString(),
      };
      reviews[existingIdx] = activeReview;
    } else {
      activeReview = {
        id: 'rev_' + Math.random().toString(36).substring(2, 9),
        user_id: effectiveUserId,
        card_id: cardId,
        flashcard_id: cardId,
        status,
        rating: status === 'known' ? 'easy' : 'hard',
        reviewed_at: new Date().toISOString(),
      };
      reviews.push(activeReview);
    }

    localStorage.setItem(STORAGE_KEYS.FLASHCARD_REVIEWS, JSON.stringify(reviews));
    return activeReview;
  }

  deleteFlashcard(id: string): void {
    const all = this.getFlashcards().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));

    // Also remove reviews for deleted card
    const reviews = this.getFlashcardReviews().filter(r => r.card_id !== id && r.flashcard_id !== id);
    localStorage.setItem(STORAGE_KEYS.FLASHCARD_REVIEWS, JSON.stringify(reviews));
  }

  // --- Code Snippets ---
  getCodeSnippets(): CodeSnippet[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CODE_SNIPPETS);
    return raw ? JSON.parse(raw) : [];
  }

  saveCodeSnippet(snippet: Omit<CodeSnippet, 'id' | 'created_at' | 'updated_at'> & { id?: string }): CodeSnippet {
    const all = this.getCodeSnippets();
    if (snippet.id) {
      const idx = all.findIndex(s => s.id === snippet.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...snippet,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.CODE_SNIPPETS, JSON.stringify(all));
        return all[idx];
      }
    }
    const newSnippet: CodeSnippet = {
      ...snippet,
      id: 'code_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(newSnippet);
    localStorage.setItem(STORAGE_KEYS.CODE_SNIPPETS, JSON.stringify(all));
    return newSnippet;
  }

  deleteCodeSnippet(id: string): void {
    const all = this.getCodeSnippets().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.CODE_SNIPPETS, JSON.stringify(all));
  }

  // --- Safety & Welfare ---
  getSafetyResources(): SafetyResource[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SAFETY_RESOURCES);
    return raw ? JSON.parse(raw) : INITIAL_MOCK_SAFETY;
  }

  addPersonalSafetyContact(contact: Omit<SafetyResource, 'id' | 'is_institutional' | 'created_at'>): SafetyResource {
    const all = this.getSafetyResources();
    const newResource: SafetyResource = {
      ...contact,
      id: 'safe_custom_' + Math.random().toString(36).substring(2, 9),
      is_institutional: false,
      created_at: new Date().toISOString(),
    };
    all.push(newResource);
    localStorage.setItem(STORAGE_KEYS.SAFETY_RESOURCES, JSON.stringify(all));
    return newResource;
  }

  deleteSafetyResource(id: string): void {
    const all = this.getSafetyResources().filter(r => r.id !== id || r.is_institutional);
    localStorage.setItem(STORAGE_KEYS.SAFETY_RESOURCES, JSON.stringify(all));
  }

  // --- Student Safety & Welfare Reports ---
  getSafetyReports(userId?: string): SafetyReport[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SAFETY_REPORTS);
    const all: SafetyReport[] = raw ? JSON.parse(raw) : [];
    if (!userId) return all;
    // Strict privacy: Only return non-anonymous reports belonging to this user
    return all.filter(r => r.user_id === userId && !r.is_anonymous);
  }

  saveSafetyReport(report: Omit<SafetyReport, 'id' | 'created_at'>): SafetyReport {
    const raw = localStorage.getItem(STORAGE_KEYS.SAFETY_REPORTS);
    const all: SafetyReport[] = raw ? JSON.parse(raw) : [];

    // Genuinely enforce anonymity: if is_anonymous is true, force user_id to null
    const effectiveUserId = report.is_anonymous ? null : (report.user_id || null);

    const newReport: SafetyReport = {
      ...report,
      id: 'rep_' + Math.random().toString(36).substring(2, 11),
      user_id: effectiveUserId,
      status: report.status || 'Submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.SAFETY_REPORTS, JSON.stringify(all));
    return newReport;
  }

  getReportByCode(code: string): Partial<SafetyReport> | null {
    const raw = localStorage.getItem(STORAGE_KEYS.SAFETY_REPORTS);
    const all: SafetyReport[] = raw ? JSON.parse(raw) : [];
    const found = all.find(r => r.report_code.trim().toUpperCase() === code.trim().toUpperCase());
    if (!found) return null;

    // Privacy safeguard: Return ONLY public tracking fields, NEVER student id or internal staff notes
    return {
      id: found.id,
      report_code: found.report_code,
      category: found.category,
      subject: found.subject,
      description: found.description,
      status: found.status,
      action_summary: found.action_summary,
      created_at: found.created_at,
    };
  }

  getVerifiedSupportContacts(): VerifiedSupportContact[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VERIFIED_SUPPORT_CONTACTS);
    if (raw) return JSON.parse(raw);

    // Initial institutional support contacts: If not verified or supplied by campus admin, show unavailable
    const defaults: VerifiedSupportContact[] = [
      {
        id: 'supp_admin',
        role: 'administration',
        title: 'College Administration & Student Affairs',
        department: 'Dean of Student Affairs',
        phone: null,
        email: null,
        location: 'Administrative Block, Ground Floor',
        hours: 'Mon - Fri: 9:00 AM - 5:00 PM',
        is_available: false,
      },
      {
        id: 'supp_security',
        role: 'security',
        title: 'Campus Security & Gate Control',
        department: 'Chief Security Officer Desk',
        phone: null,
        email: null,
        location: 'Main Security Block, North Gate',
        hours: '24/7 Gate & Patrol',
        is_available: false,
      },
      {
        id: 'supp_medical',
        role: 'medical',
        title: 'Campus Health & Medical Center',
        department: 'Health & First Aid Unit',
        phone: null,
        email: null,
        location: 'Student Amenities Complex',
        hours: 'Emergency First Aid',
        is_available: false,
      },
      {
        id: 'supp_counselor',
        role: 'counselor',
        title: 'Student Wellbeing & Counseling Cell',
        department: 'Mental Health & Guidance Cell',
        phone: null,
        email: null,
        location: 'Faculty Enclave, Room 204',
        hours: 'Confidential Support Hours',
        is_available: false,
      },
    ];

    return defaults;
  }

  // --- Rate Limiting & Privacy Wipe ---
  checkAndConsumeRateLimit(
    action: string,
    maxRequests: number = 10,
    windowSeconds: number = 3600
  ): { allowed: boolean; status: number; reset_seconds: number; error?: string } {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RATE_LIMITS);
      const limits: Record<string, number[]> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      const windowMs = windowSeconds * 1000;
      const history = (limits[action] || []).filter((ts) => now - ts < windowMs);

      if (history.length >= maxRequests) {
        const oldest = history[0];
        const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        return {
          allowed: false,
          status: 429,
          reset_seconds: resetSeconds,
          error: `Rate limit reached: You have made ${history.length}/${maxRequests} ${action} requests. Please wait ${resetSeconds} seconds before trying again.`,
        };
      }

      history.push(now);
      limits[action] = history;
      localStorage.setItem(STORAGE_KEYS.RATE_LIMITS, JSON.stringify(limits));
      return { allowed: true, status: 200, reset_seconds: 0 };
    } catch {
      return { allowed: true, status: 200, reset_seconds: 0 };
    }
  }

  // --- Source Documents & Extracted Topics ---
  getSourceDocuments(): SourceDocument[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SOURCE_DOCUMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  saveSourceDocument(doc: SourceDocument): SourceDocument {
    const all = this.getSourceDocuments();
    const idx = all.findIndex((d) => d.id === doc.id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...doc, updated_at: new Date().toISOString() };
    } else {
      all.unshift({
        ...doc,
        created_at: doc.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    localStorage.setItem(STORAGE_KEYS.SOURCE_DOCUMENTS, JSON.stringify(all));
    return doc;
  }

  deleteSourceDocument(id: string): void {
    const all = this.getSourceDocuments().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.SOURCE_DOCUMENTS, JSON.stringify(all));
    this.deleteExtractedTopics(id);
  }

  getExtractedTopics(documentId?: string): ExtractedTopic[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXTRACTED_TOPICS);
    const all: ExtractedTopic[] = raw ? JSON.parse(raw) : [];
    if (documentId) {
      return all.filter((t) => t.document_id === documentId).sort((a, b) => a.display_order - b.display_order);
    }
    return all.sort((a, b) => a.display_order - b.display_order);
  }

  saveExtractedTopics(topics: ExtractedTopic[]): ExtractedTopic[] {
    if (!topics || topics.length === 0) return [];
    const docId = topics[0].document_id;
    const existing = this.getExtractedTopics().filter((t) => t.document_id !== docId);
    const merged = [...existing, ...topics];
    localStorage.setItem(STORAGE_KEYS.EXTRACTED_TOPICS, JSON.stringify(merged));
    return topics;
  }

  deleteExtractedTopics(documentId: string): void {
    const existing = this.getExtractedTopics().filter((t) => t.document_id !== documentId);
    localStorage.setItem(STORAGE_KEYS.EXTRACTED_TOPICS, JSON.stringify(existing));
  }

  // --- Saved Speech Notes ---
  getSavedSpeechNotes(): SavedSpeechNote[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SPEECH_NOTES);
    return raw ? JSON.parse(raw) : [];
  }

  saveSpeechNote(note: Omit<SavedSpeechNote, 'id' | 'created_at'> & { id?: string }): SavedSpeechNote {
    const all = this.getSavedSpeechNotes();
    const id = note.id || `speech_${Date.now()}`;
    const newNote: SavedSpeechNote = {
      ...note,
      id,
      created_at: new Date().toISOString(),
    };
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx] = newNote;
    } else {
      all.unshift(newNote);
    }
    localStorage.setItem(STORAGE_KEYS.SPEECH_NOTES, JSON.stringify(all));
    return newNote;
  }

  deleteSavedSpeechNote(id: string): void {
    const all = this.getSavedSpeechNotes().filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.SPEECH_NOTES, JSON.stringify(all));
  }

  clearUserData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.BUDGET);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.DIAGRAMS);
    localStorage.removeItem(STORAGE_KEYS.DECKS);
    localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
    localStorage.removeItem(STORAGE_KEYS.FLASHCARD_REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.CODE_SNIPPETS);
    localStorage.removeItem(STORAGE_KEYS.RATE_LIMITS);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.SOURCE_DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXTRACTED_TOPICS);
    localStorage.removeItem(STORAGE_KEYS.SPEECH_NOTES);
    this.initializeIfEmpty();
  }
}

export const localStore = new LocalStorageService();
