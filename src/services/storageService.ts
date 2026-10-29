import {
  StudentProfile,
  Budget,
  Expense,
  Subject,
  AttendanceRecord,
  Note,
  Diagram,
  Flashcard,
  FlashcardReview,
  CodeSnippet,
  SafetyResource,
} from '../types';

import {
  INITIAL_MOCK_USER,
  INITIAL_MOCK_BUDGET,
  INITIAL_MOCK_EXPENSES,
  INITIAL_MOCK_SUBJECTS,
  generateInitialMockAttendance,
  INITIAL_MOCK_NOTES,
  INITIAL_MOCK_DIAGRAMS,
  INITIAL_MOCK_FLASHCARDS,
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
  FLASHCARDS: 'sankalp_student_flashcards',
  FLASHCARD_REVIEWS: 'sankalp_student_flashcard_reviews',
  CODE_SNIPPETS: 'sankalp_student_code_snippets',
  SAFETY_RESOURCES: 'sankalp_safety_resources',
  IS_LOGGED_IN: 'sankalp_auth_logged_in',
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
    return raw ? JSON.parse(raw) : [];
  }

  addSubject(subject: Omit<Subject, 'id' | 'created_at'>): Subject {
    const all = this.getSubjects();
    const newSub: Subject = {
      ...subject,
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    all.push(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(all));
    return newSub;
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
    return raw ? JSON.parse(raw) : [];
  }

  recordAttendance(record: Omit<AttendanceRecord, 'id' | 'created_at'>): AttendanceRecord {
    const all = this.getAttendance();
    // Validate uniqueness: duplicate attendance check for same subject and date!
    const existingIndex = all.findIndex(
      a => a.subject_id === record.subject_id && a.date === record.date
    );

    if (existingIndex !== -1) {
      // Update existing record
      all[existingIndex] = {
        ...all[existingIndex],
        status: record.status,
        notes: record.notes,
      };
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
      return all[existingIndex];
    }

    const newRecord: AttendanceRecord = {
      ...record,
      id: 'att_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    all.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
    return newRecord;
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
    return raw ? JSON.parse(raw) : [];
  }

  saveDiagram(diagram: Omit<Diagram, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Diagram {
    const all = this.getDiagrams();
    if (diagram.id) {
      const idx = all.findIndex(d => d.id === diagram.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...diagram,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(all));
        return all[idx];
      }
    }
    const newDiagram: Diagram = {
      ...diagram,
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

  // --- Flashcards ---
  getFlashcards(): Flashcard[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    return raw ? JSON.parse(raw) : [];
  }

  saveFlashcard(card: Omit<Flashcard, 'id' | 'times_reviewed' | 'times_correct' | 'created_at'> & { id?: string }): Flashcard {
    const all = this.getFlashcards();
    if (card.id) {
      const idx = all.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...card };
        localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
        return all[idx];
      }
    }
    const newCard: Flashcard = {
      ...card,
      id: 'fc_' + Math.random().toString(36).substring(2, 9),
      times_reviewed: 0,
      times_correct: 0,
      created_at: new Date().toISOString(),
    };
    all.push(newCard);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
    return newCard;
  }

  recordFlashcardReview(cardId: string, rating: 'easy' | 'good' | 'hard'): void {
    const all = this.getFlashcards();
    const idx = all.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      all[idx].times_reviewed += 1;
      if (rating === 'easy' || rating === 'good') {
        all[idx].times_correct += 1;
      }
      all[idx].last_reviewed_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
    }

    const reviews: FlashcardReview[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLASHCARD_REVIEWS) || '[]');
    reviews.push({
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      user_id: INITIAL_MOCK_USER.id,
      card_id: cardId,
      rating,
      reviewed_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.FLASHCARD_REVIEWS, JSON.stringify(reviews));
  }

  deleteFlashcard(id: string): void {
    const all = this.getFlashcards().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(all));
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
}

export const localStore = new LocalStorageService();
