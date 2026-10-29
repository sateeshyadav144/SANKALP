import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { localStore } from './storageService';
import {
  StudentProfile,
  Budget,
  Expense,
  Subject,
  AttendanceRecord,
  Note,
  Diagram,
  Flashcard,
  CodeSnippet,
  SafetyResource,
  OverallDashboardStats,
  SubjectAttendanceStat,
} from '../types';

// Simulate slight network delay for realistic responsiveness in local mode
const delay = (ms = 120) => new Promise(res => setTimeout(res, ms));

export const apiService = {
  // --------------------------------------------------------------------------
  // Configuration Status
  // --------------------------------------------------------------------------
  isLiveSupabase: () => isSupabaseConfigured,

  // --------------------------------------------------------------------------
  // Student Profile
  // --------------------------------------------------------------------------
  async getProfile(userId: string): Promise<StudentProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.getProfile();
  },

  async updateProfile(userId: string, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.saveProfile(updates);
  },

  // --------------------------------------------------------------------------
  // Expenses & Budgets
  // --------------------------------------------------------------------------
  async getExpenses(userId: string): Promise<Expense[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getExpenses();
  },

  async addExpense(userId: string, expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.addExpense({ ...expense, user_id: userId });
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.updateExpense(id, updates);
  },

  async deleteExpense(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteExpense(id);
  },

  async getBudget(userId: string, month: string): Promise<Budget> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle();
      if (data) return data;
      // If none exists, return default
      return {
        id: 'new',
        user_id: userId,
        month,
        monthly_limit: 5000,
      };
    }
    await delay();
    return localStore.getBudget();
  },

  async saveBudget(userId: string, month: string, monthlyLimit: number): Promise<Budget> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          { user_id: userId, month, monthly_limit: monthlyLimit },
          { onConflict: 'user_id,month' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.saveBudget(monthlyLimit);
  },

  // --------------------------------------------------------------------------
  // Subjects & Attendance
  // --------------------------------------------------------------------------
  async getSubjects(userId: string): Promise<Subject[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getSubjects();
  },

  async addSubject(userId: string, subject: Omit<Subject, 'id' | 'user_id' | 'created_at'>): Promise<Subject> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ ...subject, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.addSubject({ ...subject, user_id: userId });
  },

  async deleteSubject(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteSubject(id);
  },

  async getAttendanceRecords(userId: string): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getAttendance();
  },

  async recordAttendance(
    userId: string,
    record: Omit<AttendanceRecord, 'id' | 'user_id' | 'created_at'>
  ): Promise<AttendanceRecord> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(
          { ...record, user_id: userId },
          { onConflict: 'user_id,subject_id,date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.recordAttendance({ ...record, user_id: userId });
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteAttendanceRecord(id);
  },

  // --------------------------------------------------------------------------
  // Notes & AI Summaries
  // --------------------------------------------------------------------------
  async getNotes(userId: string): Promise<Note[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getNotes();
  },

  async saveNote(userId: string, note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Note> {
    if (isSupabaseConfigured && supabase) {
      if (note.id) {
        const { data, error } = await supabase
          .from('notes')
          .update(note)
          .eq('id', note.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ ...note, user_id: userId }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
    await delay();
    return localStore.saveNote({ ...note, user_id: userId });
  },

  async deleteNote(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteNote(id);
  },

  // --------------------------------------------------------------------------
  // Diagrams & Visuals
  // --------------------------------------------------------------------------
  async getDiagrams(userId: string): Promise<Diagram[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getDiagrams();
  },

  async saveDiagram(userId: string, diagram: Omit<Diagram, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Diagram> {
    if (isSupabaseConfigured && supabase) {
      if (diagram.id) {
        const { data, error } = await supabase
          .from('diagrams')
          .update(diagram)
          .eq('id', diagram.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('diagrams')
          .insert([{ ...diagram, user_id: userId }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
    await delay();
    return localStore.saveDiagram({ ...diagram, user_id: userId });
  },

  async deleteDiagram(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('diagrams').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteDiagram(id);
  },

  // --------------------------------------------------------------------------
  // Flashcards & Review Progress
  // --------------------------------------------------------------------------
  async getFlashcards(userId: string): Promise<Flashcard[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getFlashcards();
  },

  async saveFlashcard(userId: string, card: Omit<Flashcard, 'id' | 'user_id' | 'times_reviewed' | 'times_correct' | 'created_at'> & { id?: string }): Promise<Flashcard> {
    if (isSupabaseConfigured && supabase) {
      if (card.id) {
        const { data, error } = await supabase
          .from('flashcards')
          .update(card)
          .eq('id', card.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('flashcards')
          .insert([{ ...card, user_id: userId }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
    await delay();
    return localStore.saveFlashcard({ ...card, user_id: userId });
  },

  async recordFlashcardReview(userId: string, cardId: string, rating: 'easy' | 'good' | 'hard'): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('flashcard_reviews').insert([{ user_id: userId, card_id: cardId, rating }]);
      // Update card review counters
      const { data: current } = await supabase.from('flashcards').select('times_reviewed, times_correct').eq('id', cardId).single();
      if (current) {
        await supabase.from('flashcards').update({
          times_reviewed: (current.times_reviewed || 0) + 1,
          times_correct: rating !== 'hard' ? (current.times_correct || 0) + 1 : (current.times_correct || 0),
          last_reviewed_at: new Date().toISOString(),
        }).eq('id', cardId);
      }
      return;
    }
    await delay();
    localStore.recordFlashcardReview(cardId, rating);
  },

  async deleteFlashcard(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('flashcards').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteFlashcard(id);
  },

  // --------------------------------------------------------------------------
  // Code Snippets
  // --------------------------------------------------------------------------
  async getCodeSnippets(userId: string): Promise<CodeSnippet[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getCodeSnippets();
  },

  async saveCodeSnippet(userId: string, snippet: Omit<CodeSnippet, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<CodeSnippet> {
    if (isSupabaseConfigured && supabase) {
      if (snippet.id) {
        const { data, error } = await supabase
          .from('code_snippets')
          .update(snippet)
          .eq('id', snippet.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('code_snippets')
          .insert([{ ...snippet, user_id: userId }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
    await delay();
    return localStore.saveCodeSnippet({ ...snippet, user_id: userId });
  },

  async deleteCodeSnippet(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('code_snippets').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteCodeSnippet(id);
  },

  // --------------------------------------------------------------------------
  // Safety & Welfare Resources
  // --------------------------------------------------------------------------
  async getSafetyResources(userId: string): Promise<SafetyResource[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('safety_resources')
        .select('*')
        .or(`is_institutional.eq.true,user_id.eq.${userId}`)
        .order('is_institutional', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    await delay();
    return localStore.getSafetyResources();
  },

  async addPersonalSafetyContact(userId: string, contact: Omit<SafetyResource, 'id' | 'user_id' | 'is_institutional' | 'created_at'>): Promise<SafetyResource> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('safety_resources')
        .insert([{ ...contact, user_id: userId, is_institutional: false, is_verified: true }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    await delay();
    return localStore.addPersonalSafetyContact({ ...contact, user_id: userId });
  },

  async deleteSafetyResource(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('safety_resources').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await delay();
    localStore.deleteSafetyResource(id);
  },

  // --------------------------------------------------------------------------
  // Calculated Statistics (Dynamic, grounded in real saved records)
  // --------------------------------------------------------------------------
  async getDashboardStats(userId: string): Promise<OverallDashboardStats> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [expenses, budget, subjects, attendance, notes, flashcards, snippets, diagrams] = await Promise.all([
      this.getExpenses(userId),
      this.getBudget(userId, currentMonth),
      this.getSubjects(userId),
      this.getAttendanceRecords(userId),
      this.getNotes(userId),
      this.getFlashcards(userId),
      this.getCodeSnippets(userId),
      this.getDiagrams(userId),
    ]);

    // Monthly expenditure
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const monthlyExpenditure = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthlyLimit = budget.monthly_limit || 5000;
    const budgetUtilizationPct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyExpenditure / monthlyLimit) * 100)) : 0;

    // Overall attendance calculation
    let totalPresent = 0;
    let totalNonCancelled = 0;
    let lowAttendanceCount = 0;

    subjects.forEach(sub => {
      const subAtt = attendance.filter(a => a.subject_id === sub.id);
      const present = subAtt.filter(a => a.status === 'present').length;
      const valid = subAtt.filter(a => a.status === 'present' || a.status === 'absent').length;
      totalPresent += present;
      totalNonCancelled += valid;

      const pct = valid > 0 ? (present / valid) * 100 : 100;
      if (pct < (sub.target_attendance_percentage || 75)) {
        lowAttendanceCount++;
      }
    });

    const overallAttendancePct = totalNonCancelled > 0 ? Math.round((totalPresent / totalNonCancelled) * 100) : 100;

    return {
      monthlyExpenditure,
      monthlyBudget: monthlyLimit,
      budgetUtilizationPct,
      overallAttendancePct,
      totalSubjects: subjects.length,
      totalNotes: notes.length,
      totalFlashcards: flashcards.length,
      totalSnippets: snippets.length,
      totalDiagrams: diagrams.length,
      lowAttendanceCount,
    };
  },

  // Calculate subject-wise attendance metrics with required target recovery formula
  calculateSubjectStats(subjects: Subject[], records: AttendanceRecord[]): SubjectAttendanceStat[] {
    return subjects.map(sub => {
      const subRecords = records.filter(r => r.subject_id === sub.id);
      const presentClasses = subRecords.filter(r => r.status === 'present').length;
      const absentClasses = subRecords.filter(r => r.status === 'absent').length;
      const cancelledClasses = subRecords.filter(r => r.status === 'cancelled').length;
      const totalClasses = presentClasses + absentClasses;

      const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 100;
      const target = sub.target_attendance_percentage || 75;
      const isBelowTarget = percentage < target;

      // Formula: how many consecutive present classes needed to reach target T?
      // (P + x) / (N + x) >= T / 100
      // 100(P + x) >= T(N + x)
      // 100P + 100x >= TN + Tx
      // x(100 - T) >= TN - 100P
      // x >= (TN - 100P) / (100 - T)
      let classesNeededForTarget = 0;
      if (isBelowTarget && target < 100) {
        const requiredNumerator = (target * totalClasses) - (100 * presentClasses);
        const requiredDenominator = 100 - target;
        classesNeededForTarget = Math.max(0, Math.ceil(requiredNumerator / requiredDenominator));
      }

      let statusClass: 'danger' | 'warning' | 'good' = 'good';
      if (percentage < 65) statusClass = 'danger';
      else if (percentage < target) statusClass = 'warning';

      return {
        subject: sub,
        totalClasses,
        presentClasses,
        absentClasses,
        cancelledClasses,
        percentage,
        isBelowTarget,
        statusClass,
        classesNeededForTarget,
      };
    });
  }
};
