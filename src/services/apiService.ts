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
  FlashcardDeck,
  FlashcardReview,
  CodeSnippet,
  SafetyResource,
  SafetyReport,
  VerifiedSupportContact,
  OverallDashboardStats,
  SubjectAttendanceStat,
  SourceDocument,
  ExtractedTopic,
  SavedSpeechNote,
} from '../types';
import { sanitizeMermaid } from '../utils/mermaidSanitizer';

// Simulate slight network delay for realistic responsiveness in local mode
const delay = (ms = 120) => new Promise(res => setTimeout(res, ms));

const getActiveSessionUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
};

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
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', authUid)
          .order('name');
        if (!error && data) {
          const mapped = data.map(s => ({
            ...s,
            name: s.name || s.subject_name || 'Untitled Subject',
            subject_name: s.name || s.subject_name || 'Untitled Subject',
            code: s.code || s.subject_code || '',
            subject_code: s.code || s.subject_code || '',
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getSubjects error, falling back to local store:', err);
      }
    }
    await delay();
    return localStore.getSubjects();
  },

  async addSubject(userId: string, subject: Omit<Subject, 'id' | 'user_id' | 'created_at'>): Promise<Subject> {
    const cleanName = (subject.name || subject.subject_name || '').trim();
    if (!cleanName) throw new Error('Subject name is required.');
    const cleanCode = (subject.code || subject.subject_code || '').trim();

    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      // 1. Check duplicate subject name for this user in Supabase
      const { data: existing, error: existErr } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', authUid);

      if (!existErr && existing) {
        const duplicate = existing.some(
          s => (s.name || '').trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) {
          throw new Error(`A subject named "${cleanName}" already exists.`);
        }
      }

      // 2. Insert using standard columns matching live Supabase table
      const insertPayload: any = {
        user_id: authUid,
        name: cleanName,
        code: cleanCode || null,
        target_attendance_percentage: subject.target_attendance_percentage || 75,
      };

      const { data, error } = await supabase
        .from('subjects')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase addSubject error:', error);
        if (error.code === '42501') {
          throw new Error('Database permission denied (RLS). Please log in with a valid account.');
        }
        throw new Error(error.message || 'Failed to save subject to database.');
      }

      if (data) {
        const mapped: Subject = {
          ...data,
          name: data.name,
          subject_name: data.name,
          code: data.code || '',
          subject_code: data.code || '',
        };
        localStore.addSubject(mapped);
        return mapped;
      }
    }
    await delay();
    return localStore.addSubject({ ...subject, user_id: userId, name: cleanName, code: cleanCode });
  },

  async updateSubject(userId: string, id: string, updates: Partial<Subject>): Promise<Subject> {
    const cleanName = (updates.name || updates.subject_name || '').trim();
    const cleanCode = updates.code !== undefined ? updates.code.trim() : (updates.subject_code !== undefined ? updates.subject_code.trim() : undefined);

    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      if (cleanName) {
        const { data: existing } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('user_id', authUid)
          .neq('id', id);

        if (existing) {
          const duplicate = existing.some(
            s => (s.name || '').trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (duplicate) {
            throw new Error(`Another subject named "${cleanName}" already exists.`);
          }
        }
      }

      const updatePayload: any = {};
      if (cleanName) updatePayload.name = cleanName;
      if (cleanCode !== undefined) updatePayload.code = cleanCode || null;
      if (updates.target_attendance_percentage !== undefined) {
        updatePayload.target_attendance_percentage = updates.target_attendance_percentage;
      }

      const { data, error } = await supabase
        .from('subjects')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', authUid)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateSubject error:', error);
        throw new Error(error.message || 'Failed to update subject in database.');
      }

      if (data) {
        const mapped: Subject = {
          ...data,
          name: data.name,
          subject_name: data.name,
          code: data.code || '',
          subject_code: data.code || '',
        };
        localStore.updateSubject(id, mapped);
        return mapped;
      }
    }
    await delay();
    return localStore.updateSubject(id, updates);
  },

  async deleteSubject(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      // 1. Delete associated attendance records first
      await supabase.from('attendance_records').delete().eq('subject_id', id).eq('user_id', authUid);
      // 2. Delete subject
      const { error } = await supabase.from('subjects').delete().eq('id', id).eq('user_id', authUid);
      if (error) {
        console.error('Supabase deleteSubject error:', error);
        throw new Error(error.message || 'Failed to delete subject from database.');
      }
      localStore.deleteSubject(id);
      return;
    }
    await delay();
    localStore.deleteSubject(id);
  },

  async getAttendanceRecords(userId: string): Promise<AttendanceRecord[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', authUid)
          .order('date', { ascending: false });

        if (error) {
          console.error('Supabase getAttendanceRecords error:', error);
          throw error;
        }

        if (data) {
          const mapped: AttendanceRecord[] = data.map(r => {
            const cleanDate = r.date || r.attendance_date || new Date().toISOString().split('T')[0];
            const cleanStatus = (r.status?.toLowerCase() === 'present') ? 'Present' : 'Absent';
            return {
              ...r,
              date: cleanDate,
              attendance_date: cleanDate,
              status: cleanStatus,
            };
          });
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getAttendanceRecords error, falling back to local store:', err);
      }
    }
    await delay();
    return localStore.getAttendance();
  },

  async recordAttendance(
    userId: string,
    record: Omit<AttendanceRecord, 'id' | 'user_id' | 'created_at'>
  ): Promise<AttendanceRecord> {
    const cleanDate = (record.date || record.attendance_date || new Date().toISOString().split('T')[0]).trim();
    if (!cleanDate) {
      throw new Error('Valid attendance date is required.');
    }
    if (!record.subject_id) {
      throw new Error('Subject must be selected.');
    }

    const cleanStatusUI = (record.status?.toLowerCase() === 'absent') ? 'Absent' : 'Present';
    const dbStatus = cleanStatusUI.toLowerCase(); // 'present' | 'absent' to satisfy PostgreSQL check constraint!

    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      // 1. Verify subject exists and belongs to the authenticated user
      const { data: subjectVerify, error: subVerifyErr } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('id', record.subject_id)
        .eq('user_id', authUid)
        .maybeSingle();

      if (subVerifyErr || !subjectVerify) {
        throw new Error('Selected subject does not belong to your account or was not found.');
      }

      // 2. Build payload strictly matching existing database schema
      const payload = {
        user_id: authUid,
        subject_id: record.subject_id,
        date: cleanDate,
        status: dbStatus,
        notes: (record.notes || '').trim(),
      };

      // 3. Upsert using unique constraint on (user_id, subject_id, date)
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'user_id,subject_id,date' })
        .select()
        .single();

      if (error) {
        console.error('Supabase recordAttendance error:', error);
        if (error.code === '42501') {
          throw new Error('Database permission denied (RLS policy). Please log in with a valid student account.');
        }
        if (error.code === '23514') {
          throw new Error(`Attendance status "${record.status}" is invalid. Please select Present or Absent.`);
        }
        if (error.code === '23503') {
          throw new Error('The selected subject does not exist or was deleted.');
        }
        if (error.code === '23505') {
          throw new Error('An attendance record already exists for this subject on this date.');
        }
        throw new Error(error.message || 'Failed to save attendance record to database.');
      }

      if (data) {
        const mapped: AttendanceRecord = {
          ...data,
          date: data.date,
          attendance_date: data.date,
          status: cleanStatusUI,
        };
        localStore.recordAttendance(mapped);
        return mapped;
      }
    }

    // Offline / Demo fallback only if Supabase is not configured
    await delay();
    return localStore.recordAttendance({
      ...record,
      date: cleanDate,
      attendance_date: cleanDate,
      status: cleanStatusUI,
      user_id: userId,
    });
  },

  async updateAttendanceRecord(
    userId: string,
    id: string,
    updates: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> {
    const cleanStatusUI = updates.status
      ? (updates.status.toLowerCase() === 'absent' ? 'Absent' : 'Present')
      : undefined;
    const dbStatus = cleanStatusUI ? cleanStatusUI.toLowerCase() : undefined;
    const cleanDate = updates.date || updates.attendance_date;

    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      const payload: any = {};
      if (dbStatus) payload.status = dbStatus;
      if (cleanDate) payload.date = cleanDate.trim();
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { data, error } = await supabase
        .from('attendance_records')
        .update(payload)
        .eq('id', id)
        .eq('user_id', authUid)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateAttendanceRecord error:', error);
        if (error.code === '42501') {
          throw new Error('Database permission denied (RLS policy).');
        }
        throw new Error(error.message || 'Failed to update attendance record in database.');
      }

      if (data) {
        const mapped: AttendanceRecord = {
          ...data,
          date: data.date,
          attendance_date: data.date,
          status: cleanStatusUI || (data.status?.toLowerCase() === 'present' ? 'Present' : 'Absent'),
        };
        localStore.updateAttendanceRecord(id, mapped);
        return mapped;
      }
    }

    await delay();
    return localStore.updateAttendanceRecord(id, updates);
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', id)
        .eq('user_id', authUid);

      if (error) {
        console.error('Supabase deleteAttendanceRecord error:', error);
        if (error.code === '42501') {
          throw new Error('Database permission denied (RLS policy).');
        }
        throw new Error(error.message || 'Failed to delete attendance record from database.');
      }
      localStore.deleteAttendanceRecord(id);
      return;
    }
    await delay();
    localStore.deleteAttendanceRecord(id);
  },

  // --------------------------------------------------------------------------
  // Notes & AI Summaries
  // --------------------------------------------------------------------------
  async getNotes(userId: string): Promise<Note[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', authUid)
          .order('updated_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getNotes error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getNotes();
  },

  async saveNote(userId: string, note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Note> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        if (note.id) {
          const { id, user_id, created_at, updated_at, ...updatable } = note as any;
          const { data, error } = await supabase
            .from('notes')
            .update({ ...updatable, updated_at: new Date().toISOString() })
            .eq('id', note.id)
            .eq('user_id', authUid)
            .select()
            .maybeSingle();

          if (!error && data) {
            localStore.saveNote(data);
            return data;
          }
        }

        const { id, user_id, created_at, updated_at, ...insertable } = note as any;
        const { data, error } = await supabase
          .from('notes')
          .insert([{ ...insertable, user_id: authUid }])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert note error, syncing to local store:', error);
        } else if (data) {
          localStore.saveNote(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase saveNote exception, falling back to local store:', err);
      }
    }
    await delay();
    return localStore.saveNote({ ...note, user_id: userId });
  },

  async deleteNote(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('notes').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteNote error:', err);
      }
    }
    await delay();
    localStore.deleteNote(id);
  },

  // --------------------------------------------------------------------------
  // Diagrams & Visuals
  // --------------------------------------------------------------------------
  async getDiagrams(userId: string): Promise<Diagram[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('diagrams')
          .select('*')
          .eq('user_id', authUid)
          .order('updated_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            ...d,
            mermaid_code: sanitizeMermaid(d.mermaid_code || '')
          }));
        }
      } catch (err) {
        console.warn('Supabase getDiagrams error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getDiagrams().map(d => ({
      ...d,
      mermaid_code: sanitizeMermaid(d.mermaid_code || '')
    }));
  },

  async saveDiagram(userId: string, diagram: Omit<Diagram, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Diagram> {
    const authUid = await getActiveSessionUserId();
    const cleanCode = sanitizeMermaid(diagram.mermaid_code || '');
    if (authUid && supabase) {
      try {
        if (diagram.id) {
          const { id, user_id, created_at, updated_at, ...updatable } = diagram as any;
          const { data, error } = await supabase
            .from('diagrams')
            .update({ ...updatable, mermaid_code: cleanCode, updated_at: new Date().toISOString() })
            .eq('id', diagram.id)
            .eq('user_id', authUid)
            .select()
            .maybeSingle();

          if (!error && data) {
            localStore.saveDiagram({ ...data, mermaid_code: cleanCode });
            return { ...data, mermaid_code: cleanCode };
          }
        }

        const { id, user_id, created_at, updated_at, ...insertable } = diagram as any;
        const { data, error } = await supabase
          .from('diagrams')
          .insert([{ ...insertable, mermaid_code: cleanCode, user_id: authUid }])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert diagram error, syncing to local store:', error);
        } else if (data) {
          localStore.saveDiagram({ ...data, mermaid_code: cleanCode });
          return { ...data, mermaid_code: cleanCode };
        }
      } catch (err) {
        console.warn('Supabase saveDiagram exception, falling back to local store:', err);
      }
    }
    await delay();
    return localStore.saveDiagram({ ...diagram, mermaid_code: cleanCode, user_id: userId });
  },

  async deleteDiagram(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('diagrams').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteDiagram error:', err);
      }
    }
    await delay();
    localStore.deleteDiagram(id);
  },

  // --------------------------------------------------------------------------
  // Source Documents & Extracted Topics for PDF Visuals
  // --------------------------------------------------------------------------
  async getSourceDocuments(userId: string): Promise<SourceDocument[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('source_documents')
          .select('*')
          .eq('user_id', authUid)
          .order('updated_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getSourceDocuments error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getSourceDocuments();
  },

  async saveSourceDocument(
    userId: string,
    doc: Omit<SourceDocument, 'user_id'> & { user_id?: string }
  ): Promise<SourceDocument> {
    const authUid = await getActiveSessionUserId();
    const effectiveUserId = authUid || userId;
    const documentToSave: SourceDocument = {
      ...doc,
      user_id: effectiveUserId,
      processing_status: doc.processing_status || 'completed',
      created_at: doc.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('source_documents')
          .upsert([documentToSave])
          .select()
          .maybeSingle();
        if (!error && data) {
          localStore.saveSourceDocument(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase saveSourceDocument error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.saveSourceDocument(documentToSave);
  },

  async deleteSourceDocument(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('source_documents').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteSourceDocument error:', err);
      }
    }
    localStore.deleteSourceDocument(id);
  },

  async getExtractedTopics(documentId: string): Promise<ExtractedTopic[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('extracted_topics')
          .select('*')
          .eq('document_id', documentId)
          .eq('user_id', authUid)
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getExtractedTopics error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getExtractedTopics(documentId);
  },

  async saveExtractedTopics(topics: ExtractedTopic[]): Promise<ExtractedTopic[]> {
    if (!topics || topics.length === 0) return [];
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const payload = topics.map((t) => ({
          ...t,
          user_id: authUid,
        }));
        const { data, error } = await supabase
          .from('extracted_topics')
          .upsert(payload)
          .select();
        if (!error && data && data.length > 0) {
          localStore.saveExtractedTopics(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase saveExtractedTopics error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.saveExtractedTopics(topics);
  },

  // --------------------------------------------------------------------------
  // Saved Speech Notes (Text-to-Speech Reader)
  // --------------------------------------------------------------------------
  async getSavedSpeechNotes(userId: string): Promise<SavedSpeechNote[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('saved_speech_notes')
          .select('*')
          .eq('user_id', authUid)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getSavedSpeechNotes fallback:', err);
      }
    }
    await delay();
    return localStore.getSavedSpeechNotes();
  },

  async saveSpeechNote(
    userId: string,
    note: Omit<SavedSpeechNote, 'id' | 'created_at' | 'user_id'> & { id?: string; user_id?: string }
  ): Promise<SavedSpeechNote> {
    const authUid = await getActiveSessionUserId();
    const effectiveUserId = authUid || userId;
    const noteToSave: SavedSpeechNote = {
      ...note,
      id: note.id || `speech_${Date.now()}`,
      user_id: effectiveUserId,
      created_at: new Date().toISOString(),
    };

    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('saved_speech_notes')
          .upsert([noteToSave])
          .select()
          .maybeSingle();
        if (!error && data) {
          localStore.saveSpeechNote(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase saveSpeechNote fallback:', err);
      }
    }
    await delay();
    return localStore.saveSpeechNote(noteToSave);
  },

  async deleteSavedSpeechNote(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('saved_speech_notes').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteSavedSpeechNote error:', err);
      }
    }
    await delay();
    localStore.deleteSavedSpeechNote(id);
  },

  // --------------------------------------------------------------------------
  // Flashcards, Decks & Review Progress
  // --------------------------------------------------------------------------
  async getDecks(userId: string): Promise<FlashcardDeck[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('flashcard_decks')
          .select('*')
          .eq('user_id', authUid)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getDecks error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getDecks();
  },

  async saveDeck(
    userId: string,
    deck: Omit<FlashcardDeck, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<FlashcardDeck> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        if (deck.id) {
          const { data, error } = await supabase
            .from('flashcard_decks')
            .update({
              title: deck.title,
              subject: deck.subject || null,
              description: deck.description || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', deck.id)
            .eq('user_id', authUid)
            .select()
            .maybeSingle();

          if (!error && data) {
            localStore.saveDeck(data);
            return data;
          }
        } else {
          const { data, error } = await supabase
            .from('flashcard_decks')
            .insert([
              {
                user_id: authUid,
                title: deck.title,
                subject: deck.subject || null,
                description: deck.description || null,
              },
            ])
            .select()
            .single();

          if (!error && data) {
            localStore.saveDeck(data);
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase saveDeck error, saving locally:', err);
      }
    }
    await delay();
    return localStore.saveDeck({ ...deck, user_id: userId });
  },

  async deleteDeck(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('flashcards').delete().eq('deck_id', id).eq('user_id', authUid);
        await supabase.from('flashcard_decks').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteDeck error:', err);
      }
    }
    await delay();
    localStore.deleteDeck(id);
  },

  async getFlashcards(userId: string, deckId?: string): Promise<Flashcard[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        let query = supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', authUid)
          .order('created_at', { ascending: false });

        if (deckId) {
          query = query.eq('deck_id', deckId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getFlashcards error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getFlashcards(deckId);
  },

  async saveFlashcard(
    userId: string,
    card: Omit<Flashcard, 'id' | 'user_id' | 'times_reviewed' | 'times_correct' | 'created_at'> & { id?: string }
  ): Promise<Flashcard> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        if (card.id) {
          const { id, user_id, created_at, ...updatable } = card as any;
          const { data, error } = await supabase
            .from('flashcards')
            .update(updatable)
            .eq('id', card.id)
            .eq('user_id', authUid)
            .select()
            .maybeSingle();

          if (!error && data) {
            localStore.saveFlashcard(data);
            return data;
          }
        } else {
          const { id, user_id, created_at, ...insertable } = card as any;
          // First attempt insert with deck_id
          const { data, error } = await supabase
            .from('flashcards')
            .insert([{ ...insertable, user_id: authUid }])
            .select()
            .single();

          if (!error && data) {
            localStore.saveFlashcard(data);
            return data;
          }

          if (error && error.code === '42703') {
            // If deck_id column is not in remote schema yet, retry without deck_id
            const { deck_id, ...compatInsertable } = insertable;
            const { data: retryData, error: retryErr } = await supabase
              .from('flashcards')
              .insert([{ ...compatInsertable, user_id: authUid }])
              .select()
              .single();

            if (!retryErr && retryData) {
              const fullData = { ...retryData, deck_id: card.deck_id };
              localStore.saveFlashcard(fullData);
              return fullData;
            }
          }
        }
      } catch (err) {
        console.warn('Supabase saveFlashcard error, syncing locally:', err);
      }
    }
    await delay();
    return localStore.saveFlashcard({ ...card, user_id: userId });
  },

  async saveFlashcardsBatch(
    userId: string,
    cards: Array<Omit<Flashcard, 'id' | 'user_id' | 'times_reviewed' | 'times_correct' | 'created_at'> & { id?: string }>
  ): Promise<Flashcard[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const payload = cards.map((c) => ({
          user_id: authUid,
          deck_id: c.deck_id,
          subject: c.subject || 'General',
          topic: c.topic || '',
          question: c.question,
          answer: c.answer,
          hint: c.hint || '',
          difficulty: c.difficulty || 'medium',
        }));

        const { data, error } = await supabase
          .from('flashcards')
          .insert(payload)
          .select();

        if (!error && data) {
          localStore.saveFlashcardsBatch(data);
          return data;
        }

        if (error && error.code === '42703') {
          // Retry without deck_id if column not migrated
          const compatPayload = payload.map(({ deck_id, ...rest }) => rest);
          const { data: retryData, error: retryErr } = await supabase
            .from('flashcards')
            .insert(compatPayload)
            .select();

          if (!retryErr && retryData) {
            const mapped = retryData.map((d, i) => ({ ...d, deck_id: cards[i]?.deck_id }));
            localStore.saveFlashcardsBatch(mapped);
            return mapped;
          }
        }
      } catch (err) {
        console.warn('Supabase saveFlashcardsBatch error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.saveFlashcardsBatch(cards.map((c) => ({ ...c, user_id: userId })));
  },

  async getFlashcardReviews(userId: string): Promise<FlashcardReview[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('flashcard_reviews')
          .select('*')
          .eq('user_id', authUid)
          .order('reviewed_at', { ascending: false });

        if (!error && data) {
          // Normalize status
          const mapped: FlashcardReview[] = data.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            card_id: r.card_id || r.flashcard_id,
            flashcard_id: r.flashcard_id || r.card_id,
            status: r.status || (r.rating === 'hard' ? 'revision' : 'known'),
            rating: r.rating || (r.status === 'known' ? 'easy' : 'hard'),
            reviewed_at: r.reviewed_at,
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getFlashcardReviews error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getFlashcardReviews(userId);
  },

  async recordFlashcardReview(
    userId: string,
    cardId: string,
    status: 'known' | 'revision'
  ): Promise<FlashcardReview> {
    const authUid = await getActiveSessionUserId();
    const rating: 'easy' | 'hard' = status === 'known' ? 'easy' : 'hard';

    if (authUid && supabase) {
      try {
        // Find existing review
        const { data: existing } = await supabase
          .from('flashcard_reviews')
          .select('id')
          .eq('user_id', authUid)
          .eq('card_id', cardId)
          .maybeSingle();

        if (existing) {
          // Update existing review
          await supabase
            .from('flashcard_reviews')
            .update({
              rating,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .eq('user_id', authUid);
        } else {
          // Insert new review
          await supabase.from('flashcard_reviews').insert([
            {
              user_id: authUid,
              card_id: cardId,
              rating,
              reviewed_at: new Date().toISOString(),
            },
          ]);
        }

        // Update card stats in flashcards table
        const { data: current } = await supabase
          .from('flashcards')
          .select('times_reviewed, times_correct')
          .eq('id', cardId)
          .maybeSingle();

        if (current) {
          await supabase
            .from('flashcards')
            .update({
              times_reviewed: (current.times_reviewed || 0) + 1,
              times_correct: status === 'known' ? (current.times_correct || 0) + 1 : (current.times_correct || 0),
              last_reviewed_at: new Date().toISOString(),
            })
            .eq('id', cardId)
            .eq('user_id', authUid);
        }
      } catch (err) {
        console.warn('Supabase recordFlashcardReview error:', err);
      }
    }
    await delay();
    return localStore.recordFlashcardReview(cardId, status, userId);
  },

  async deleteFlashcard(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('flashcard_reviews').delete().eq('card_id', id).eq('user_id', authUid);
        await supabase.from('flashcards').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteFlashcard error:', err);
      }
    }
    await delay();
    localStore.deleteFlashcard(id);
  },

  // --------------------------------------------------------------------------
  // Code Snippets
  // --------------------------------------------------------------------------
  async getCodeSnippets(userId: string): Promise<CodeSnippet[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('code_snippets')
          .select('*')
          .eq('user_id', authUid)
          .order('updated_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getCodeSnippets error, using local fallback:', err);
      }
    }
    await delay();
    return localStore.getCodeSnippets();
  },

  async saveCodeSnippet(userId: string, snippet: Omit<CodeSnippet, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<CodeSnippet> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        if (snippet.id) {
          const { id, user_id, created_at, updated_at, ...updatable } = snippet as any;
          const { data, error } = await supabase
            .from('code_snippets')
            .update({ ...updatable, updated_at: new Date().toISOString() })
            .eq('id', snippet.id)
            .eq('user_id', authUid)
            .select()
            .maybeSingle();

          if (!error && data) {
            localStore.saveCodeSnippet(data);
            return data;
          }
        }

        const { id, user_id, created_at, updated_at, ...insertable } = snippet as any;
        const { data, error } = await supabase
          .from('code_snippets')
          .insert([{ ...insertable, user_id: authUid }])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert code snippet error, syncing to local store:', error);
        } else if (data) {
          localStore.saveCodeSnippet(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase saveCodeSnippet exception, falling back to local store:', err);
      }
    }
    await delay();
    return localStore.saveCodeSnippet({ ...snippet, user_id: userId });
  },

  async deleteCodeSnippet(id: string): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.from('code_snippets').delete().eq('id', id).eq('user_id', authUid);
      } catch (err) {
        console.warn('Supabase deleteCodeSnippet error:', err);
      }
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
  // Student Safety & Welfare Incident Reports
  // --------------------------------------------------------------------------
  async getSafetyReports(userId: string): Promise<SafetyReport[]> {
    const authUid = await getActiveSessionUserId();
    const effectiveUserId = authUid || userId;

    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('safety_reports')
          .select('id, report_code, user_id, is_anonymous, category, subject, description, attachment_url, attachment_name, attachment_size, status, action_summary, created_at, updated_at')
          .eq('user_id', effectiveUserId)
          .eq('is_anonymous', false)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getSafetyReports error, using local fallback:', err);
      }
    }

    await delay();
    return localStore.getSafetyReports(effectiveUserId);
  },

  async submitSafetyReport(
    report: Omit<SafetyReport, 'id' | 'created_at'>
  ): Promise<SafetyReport> {
    const authUid = await getActiveSessionUserId();

    // Critical privacy enforcement: If report is marked anonymous, strictly wipe user_id
    const effectiveUserId = report.is_anonymous ? null : (authUid || report.user_id || null);

    const payload = {
      report_code: report.report_code,
      user_id: effectiveUserId,
      is_anonymous: Boolean(report.is_anonymous),
      category: report.category,
      subject: report.subject.trim(),
      description: report.description.trim(),
      attachment_url: report.attachment_url || null,
      attachment_name: report.attachment_name || null,
      attachment_size: report.attachment_size || null,
      status: report.status || 'Submitted',
      action_summary: null,
      staff_notes: null,
    };

    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('safety_reports')
          .insert([payload])
          .select('id, report_code, user_id, is_anonymous, category, subject, description, attachment_url, attachment_name, attachment_size, status, action_summary, created_at, updated_at')
          .single();

        if (!error && data) {
          localStore.saveSafetyReport(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase submitSafetyReport error, using local fallback:', err);
      }
    }

    await delay(30);
    return localStore.saveSafetyReport({
      ...payload,
      user_id: effectiveUserId,
    });
  },

  async trackReportStatus(reportCode: string): Promise<Partial<SafetyReport> | null> {
    const cleanedCode = reportCode.trim().toUpperCase();
    if (!cleanedCode) return null;

    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        // Attempt secure RPC first if deployed
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('track_report_status', { p_report_code: cleanedCode });

        if (!rpcError && rpcData && rpcData.length > 0) {
          return rpcData[0];
        }

        // Fallback to direct query selecting only non-sensitive columns
        const { data, error } = await supabase
          .from('safety_reports')
          .select('id, report_code, category, subject, description, status, action_summary, created_at')
          .eq('report_code', cleanedCode)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase trackReportStatus error, using local fallback:', err);
      }
    }

    await delay(30);
    return localStore.getReportByCode(cleanedCode);
  },

  async getVerifiedSupportContacts(): Promise<VerifiedSupportContact[]> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase
          .from('safety_resources')
          .select('*')
          .eq('is_institutional', true)
          .eq('is_verified', true);

        if (!error && data && data.length > 0) {
          // Map to standard verified support roles
          const contacts: VerifiedSupportContact[] = [
            {
              id: 'supp_admin',
              role: 'administration',
              title: 'College Administration & Student Affairs',
              department: 'Dean of Student Affairs',
              phone: data.find(d => d.category === 'helpline')?.phone || null,
              email: data.find(d => d.category === 'helpline')?.email || null,
              location: data.find(d => d.category === 'helpline')?.location || 'Administrative Block',
              hours: data.find(d => d.category === 'helpline')?.hours || 'Mon - Fri: 9:00 AM - 5:00 PM',
              is_available: Boolean(data.find(d => d.category === 'helpline')?.phone),
            },
            {
              id: 'supp_security',
              role: 'security',
              title: 'Campus Security & Gate Control',
              department: 'Campus Security Department',
              phone: data.find(d => d.category === 'security')?.phone || null,
              email: data.find(d => d.category === 'security')?.email || null,
              location: data.find(d => d.category === 'security')?.location || 'Main Gate Security Block',
              hours: data.find(d => d.category === 'security')?.hours || '24/7 Gate Patrol',
              is_available: Boolean(data.find(d => d.category === 'security')?.phone),
            },
            {
              id: 'supp_medical',
              role: 'medical',
              title: 'Campus Health & Medical Assistance',
              department: 'Health Center & First Aid',
              phone: data.find(d => d.category === 'medical')?.phone || null,
              email: data.find(d => d.category === 'medical')?.email || null,
              location: data.find(d => d.category === 'medical')?.location || 'Student Amenities Complex',
              hours: data.find(d => d.category === 'medical')?.hours || 'Emergency Care',
              is_available: Boolean(data.find(d => d.category === 'medical')?.phone),
            },
            {
              id: 'supp_counselor',
              role: 'counselor',
              title: 'Student Wellbeing & Counseling Services',
              department: 'Mental Health & Student Wellbeing Cell',
              phone: data.find(d => d.category === 'mental_health')?.phone || null,
              email: data.find(d => d.category === 'mental_health')?.email || null,
              location: data.find(d => d.category === 'mental_health')?.location || 'Faculty Enclave, Room 204',
              hours: data.find(d => d.category === 'mental_health')?.hours || 'Confidential Support Hours',
              is_available: Boolean(data.find(d => d.category === 'mental_health')?.phone),
            },
          ];
          return contacts;
        }
      } catch (err) {
        console.warn('Supabase getVerifiedSupportContacts error, using local fallback:', err);
      }
    }

    await delay(30);
    return localStore.getVerifiedSupportContacts();
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
      const present = subAtt.filter(a => a.status?.toLowerCase() === 'present').length;
      const valid = subAtt.filter(a => a.status?.toLowerCase() === 'present' || a.status?.toLowerCase() === 'absent').length;
      totalPresent += present;
      totalNonCancelled += valid;

      const pct = valid > 0 ? (present / valid) * 100 : 0;
      if (valid > 0 && pct < (sub.target_attendance_percentage || 75)) {
        lowAttendanceCount++;
      }
    });

    const overallAttendancePct = totalNonCancelled > 0 ? Math.round((totalPresent / totalNonCancelled) * 100) : 0;

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
      const presentClasses = subRecords.filter(r => r.status?.toLowerCase() === 'present').length;
      const absentClasses = subRecords.filter(r => r.status?.toLowerCase() === 'absent').length;
      const cancelledClasses = subRecords.filter(r => r.status?.toLowerCase() === 'cancelled').length;
      const totalClasses = presentClasses + absentClasses;

      const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 0;
      const target = sub.target_attendance_percentage || 75;
      const isBelowTarget = totalClasses > 0 && percentage < target;

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
      if (totalClasses === 0) statusClass = 'good';
      else if (percentage < 65) statusClass = 'danger';
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
  },

  // --------------------------------------------------------------------------
  // Server-Side Rate Limiting & Gemini AI Proxy
  // --------------------------------------------------------------------------
  async checkRateLimit(
    action: 'ai_notes' | 'ai_flashcards' | 'diagram_gen' | 'ai_topics' | 'ai_visual',
    maxRequests: number = 10,
    windowSeconds: number = 3600
  ): Promise<{ allowed: boolean; status: number; reset_seconds: number; error?: string }> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        const { data, error } = await supabase.rpc('check_and_consume_rate_limit', {
          p_action: action,
          p_max_requests: maxRequests,
          p_window_seconds: windowSeconds,
        });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase rate check RPC fallback:', err);
      }
    }
    return localStore.checkAndConsumeRateLimit(action, maxRequests, windowSeconds);
  },

  async invokeGeminiAi(params: {
    actionType: 'ai_notes' | 'ai_flashcards' | 'ai_topics' | 'ai_visual';
    contents: any[];
    generationConfig?: any;
  }): Promise<{ success: boolean; data?: any; fallback_required?: boolean; error?: string }> {
    const maxRequests = params.actionType === 'ai_flashcards' ? 5 : 10;
    const rateCheck = await this.checkRateLimit(params.actionType, maxRequests, 3600);

    if (!rateCheck.allowed) {
      throw new Error(rateCheck.error || `Rate limit reached. Please wait ${rateCheck.reset_seconds}s.`);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
          body: {
            actionType: params.actionType,
            contents: params.contents,
            generationConfig: params.generationConfig,
          },
        });

        if (error) {
          return { success: false, fallback_required: true, error: error.message };
        }
        if (data?.fallback_required) {
          return { success: false, fallback_required: true, error: data?.error };
        }
        return { success: true, data };
      } catch (err: any) {
        return { success: false, fallback_required: true, error: err?.message };
      }
    }

    return { success: false, fallback_required: true };
  },

  // --------------------------------------------------------------------------
  // Multilingual Cloud TTS Synthesis
  // --------------------------------------------------------------------------
  async synthesizeCloudSpeech(
    text: string,
    languageCode: string,
    iso: string
  ): Promise<{ audioBlob: Blob; audioUrl: string }> {
    try {
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, languageCode, iso }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return { audioBlob, audioUrl };
      }

      const errJson = await response.json().catch(() => ({}));
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    } catch (localErr: any) {
      console.warn('Local TTS endpoint error:', localErr.message);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('cloud-tts', {
          body: { text, languageCode, iso },
        });

        if (!error && data) {
          const audioBlob = new Blob([data], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          return { audioBlob, audioUrl };
        }
      } catch (sbErr) {
        console.warn('Supabase edge function TTS fallback error:', sbErr);
      }
    }

    throw new Error('Unable to synthesize speech via Cloud TTS. Please verify network connectivity.');
  },

  // --------------------------------------------------------------------------
  // Student Data Privacy & GDPR Account Erasure
  // --------------------------------------------------------------------------
  async deleteStudentAccount(): Promise<void> {
    const authUid = await getActiveSessionUserId();
    if (authUid && supabase) {
      try {
        await supabase.rpc('delete_student_account_data');
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error during database account erasure:', err);
      }
    }
    localStore.clearUserData();
  },
};
