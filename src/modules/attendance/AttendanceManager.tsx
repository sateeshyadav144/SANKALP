import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Filter,
  Calendar,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Check,
  X,
  Loader2,
  ChevronRight,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Subject, AttendanceRecord, SubjectAttendanceStat } from '../../types';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const AttendanceManager: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Add Subject Form states
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [submittingSubject, setSubmittingSubject] = useState(false);

  // Edit Subject Form states
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCode, setEditSubCode] = useState('');
  const [submittingEditSubject, setSubmittingEditSubject] = useState(false);

  // Mark Attendance Form states
  const [markSubjectId, setMarkSubjectId] = useState('');
  const [markDate, setMarkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [markStatus, setMarkStatus] = useState<'Present' | 'Absent'>('Present');
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // History Filter states
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'Present' | 'Absent'>('all');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('all');
  const [historySearchDate, setHistorySearchDate] = useState<string>('');

  // Subject Details Modal state
  const [selectedSubjectDetails, setSelectedSubjectDetails] = useState<Subject | null>(null);

  // Edit Single Attendance Record state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editRecordStatus, setEditRecordStatus] = useState<'Present' | 'Absent'>('Present');
  const [editRecordDate, setEditRecordDate] = useState('');
  const [submittingEditRecord, setSubmittingEditRecord] = useState(false);

  // Load all subjects and attendance records
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subs, atts] = await Promise.all([
        apiService.getSubjects(user.id),
        apiService.getAttendanceRecords(user.id),
      ]);
      setSubjects(subs || []);
      setRecords(atts || []);
      if (subs && subs.length > 0 && !markSubjectId) {
        setMarkSubjectId(subs[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      showToast('Failed to load attendance records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Overall Statistics calculated strictly from real saved attendance records
  const overallStats = useMemo(() => {
    const presentRecords = records.filter(
      (r) => r.status?.toLowerCase() === 'present'
    ).length;
    const absentRecords = records.filter(
      (r) => r.status?.toLowerCase() === 'absent'
    ).length;
    const totalClasses = presentRecords + absentRecords;
    const percentage =
      totalClasses > 0 ? Math.round((presentRecords / totalClasses) * 1000) / 10 : 0;

    // Consecutive classes required to reach 75% target criteria:
    // (P + N) / (T + N) >= 0.75  =>  N >= 3T - 4P
    const consecutiveNeeded =
      percentage < 75
        ? Math.max(0, Math.ceil(3 * totalClasses - 4 * presentRecords))
        : 0;

    // Buffer classes that can be missed while remaining >= 75%:
    // P / (T + M) >= 0.75  =>  M <= (4P - 3T) / 3
    const canMiss =
      percentage >= 75 && totalClasses > 0
        ? Math.max(0, Math.floor((4 * presentRecords - 3 * totalClasses) / 3))
        : 0;

    const diffFromTarget = Math.round((percentage - 75) * 10) / 10;

    return {
      totalClasses,
      presentClasses: presentRecords,
      absentClasses: absentRecords,
      percentage,
      consecutiveNeeded,
      canMiss,
      diffFromTarget,
      isBelowTarget: totalClasses > 0 && percentage < 75,
      hasRecords: totalClasses > 0,
    };
  }, [records]);

  // Subject-wise stats
  const subjectStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; present: number; absent: number; percentage: number }>();
    subjects.forEach((sub) => {
      const subRecords = records.filter((r) => r.subject_id === sub.id);
      const present = subRecords.filter((r) => r.status?.toLowerCase() === 'present').length;
      const absent = subRecords.filter((r) => r.status?.toLowerCase() === 'absent').length;
      const total = present + absent;
      const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
      map.set(sub.id, { total, present, absent, percentage });
    });
    return map;
  }, [subjects, records]);

  // Handle Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanName = newSubName.trim();
    if (!cleanName) {
      showToast('Please enter a subject name.', 'error');
      return;
    }

    // Check duplicate locally
    const duplicate = subjects.some(
      (s) => s.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      showToast(`Subject "${cleanName}" already exists.`, 'error');
      return;
    }

    setSubmittingSubject(true);
    try {
      const added = await apiService.addSubject(user.id, {
        name: cleanName,
        code: newSubCode.trim() || undefined,
        target_attendance_percentage: 75,
      });

      if (added) {
        showToast(`Subject "${cleanName}" added successfully.`, 'success');
        setNewSubName('');
        setNewSubCode('');
        setIsAddingSubject(false);
        await loadData();
        if (!markSubjectId) setMarkSubjectId(added.id);
      }
    } catch (err: any) {
      console.error('Error adding subject:', err);
      showToast(err.message || 'Failed to save subject.', 'error');
    } finally {
      setSubmittingSubject(false);
    }
  };

  // Handle Edit Subject
  const handleEditSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingSubject) return;
    const cleanName = editSubName.trim();
    if (!cleanName) {
      showToast('Subject name cannot be empty.', 'error');
      return;
    }

    const duplicate = subjects.some(
      (s) => s.id !== editingSubject.id && s.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      showToast(`Another subject named "${cleanName}" already exists.`, 'error');
      return;
    }

    setSubmittingEditSubject(true);
    try {
      await apiService.updateSubject(user.id, editingSubject.id, {
        name: cleanName,
        code: editSubCode.trim() || undefined,
      });

      showToast(`Subject "${cleanName}" updated successfully.`, 'success');
      setEditingSubject(null);
      await loadData();
    } catch (err: any) {
      console.error('Error updating subject:', err);
      showToast(err.message || 'Failed to update subject.', 'error');
    } finally {
      setSubmittingEditSubject(false);
    }
  };

  // Handle Delete Subject with confirmation
  const handleDeleteSubject = async (sub: Subject) => {
    const subRecordCount = records.filter((r) => r.subject_id === sub.id).length;
    const confirmMessage =
      subRecordCount > 0
        ? `Are you sure you want to delete "${sub.name}"?\n\nWarning: This will permanently delete the subject AND all ${subRecordCount} attendance records associated with it.`
        : `Are you sure you want to delete "${sub.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await apiService.deleteSubject(sub.id);
      showToast(`Subject "${sub.name}" deleted.`, 'info');
      if (selectedSubjectDetails?.id === sub.id) {
        setSelectedSubjectDetails(null);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      showToast('Failed to delete subject.', 'error');
    }
  };

  // Handle Mark Attendance
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to save attendance.', 'error');
      return;
    }
    if (!markSubjectId) {
      showToast('Please select a subject first.', 'error');
      return;
    }
    if (!markDate) {
      showToast('Please pick a class date.', 'error');
      return;
    }

    const targetSub = subjects.find((s) => s.id === markSubjectId);
    if (!targetSub) {
      showToast('Selected subject was not found or does not belong to your account.', 'error');
      return;
    }

    setSubmittingAttendance(true);

    try {
      const saved = await apiService.recordAttendance(user.id, {
        subject_id: markSubjectId,
        date: markDate,
        status: markStatus,
        notes: `Recorded on ${markDate}`,
      });

      if (saved) {
        showToast(
          `Marked ${markStatus} for ${targetSub?.name || 'Subject'} on ${markDate}.`,
          'success'
        );
        await loadData();
      }
    } catch (err: any) {
      console.error('Error recording attendance:', err);
      showToast(err?.message || 'Failed to save attendance record.', 'error');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Handle Edit Single Record Submit
  const handleEditRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingRecord) return;
    setSubmittingEditRecord(true);
    try {
      await apiService.updateAttendanceRecord(user.id, editingRecord.id, {
        status: editRecordStatus,
        date: editRecordDate,
      });
      showToast('Attendance record updated.', 'success');
      setEditingRecord(null);
      await loadData();
    } catch (err: any) {
      console.error('Error updating record:', err);
      showToast(err?.message || 'Failed to update attendance record.', 'error');
    } finally {
      setSubmittingEditRecord(false);
    }
  };

  // Handle Delete Single Record
  const handleDeleteRecord = async (record: AttendanceRecord) => {
    if (!window.confirm(`Delete attendance record for ${record.date}?`)) return;
    try {
      await apiService.deleteAttendanceRecord(record.id);
      showToast('Attendance entry deleted.', 'info');
      await loadData();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      showToast(err?.message || 'Failed to delete record.', 'error');
    }
  };

  // Quick toggle status of record
  const handleQuickToggleRecord = async (record: AttendanceRecord) => {
    if (!user) return;
    const newStatus: 'Present' | 'Absent' =
      record.status?.toLowerCase() === 'present' ? 'Absent' : 'Present';
    try {
      await apiService.updateAttendanceRecord(user.id, record.id, {
        status: newStatus,
      });
      showToast(`Status updated to ${newStatus}.`, 'success');
      await loadData();
    } catch (err: any) {
      console.error('Quick toggle failed:', err);
      showToast(err?.message || 'Failed to toggle status.', 'error');
    }
  };

  // Filtered History Records (sorted newest date first)
  const filteredRecords = useMemo(() => {
    return [...records]
      .filter((r) => {
        const matchesStatus =
          historyStatusFilter === 'all' ||
          r.status?.toLowerCase() === historyStatusFilter.toLowerCase();
        const matchesSubject =
          historySubjectFilter === 'all' || r.subject_id === historySubjectFilter;
        const matchesDate = !historySearchDate || r.date === historySearchDate;
        return matchesStatus && matchesSubject && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, historyStatusFilter, historySubjectFilter, historySearchDate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border pointer-events-auto transition-all animate-in slide-in-from-top-2 ${
              t.type === 'success'
                ? 'bg-[#061830] border-emerald-500/40 text-emerald-300'
                : t.type === 'error'
                ? 'bg-[#061830] border-rose-500/40 text-rose-300'
                : 'bg-[#061830] border-[#00D9FF]/40 text-[#00D9FF]'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#00D9FF] shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="p-1 text-[#9BAFCB] hover:text-[#F4F7FF] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#087BFF]/30 shadow-[0_0_20px_rgba(8,123,255,0.15)]">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
              Attendance Manager
            </h1>
            <p className="text-xs text-[#9BAFCB]">
              Track your classes, monitor the 75% attendance criteria, and manage your course records.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAddingSubject(!isAddingSubject);
            setNewSubName('');
            setNewSubCode('');
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#087BFF] hover:opacity-95 text-[#020B1A] shadow-[0_0_20px_rgba(0,217,255,0.2)] transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#020B1A]" />
          <span>{isAddingSubject ? 'Close Form' : 'Add Subject'}</span>
        </button>
      </div>

      {/* Add Subject Simple Form (Collapsible) */}
      {isAddingSubject && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#00D9FF]/30 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#17365C] pb-3">
            <h3 className="text-sm font-bold text-[#F4F7FF] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00D9FF]" />
              <span>Add New Subject</span>
            </h3>
            <button
              onClick={() => setIsAddingSubject(false)}
              className="text-[#9BAFCB] hover:text-[#F4F7FF] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1">
                Subject Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems, Computer Networks"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-[#9BAFCB]/50 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1">
                Subject Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CS601, IT402"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-mono text-[#F4F7FF] placeholder-[#9BAFCB]/50 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submittingSubject}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submittingSubject ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#071B35] border border-[#17365C] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#17365C] pb-3">
              <h3 className="text-base font-bold text-[#F4F7FF]">Edit Subject</h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-[#9BAFCB] hover:text-[#F4F7FF] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                  Subject Code (Optional)
                </label>
                <input
                  type="text"
                  value={editSubCode}
                  onChange={(e) => setEditSubCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-mono text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#17365C]">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#9BAFCB] bg-[#030E1F] border border-[#17365C] hover:text-[#F4F7FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditSubject}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingEditSubject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Update Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. ATTENDANCE DASHBOARD: Overview Metrics & Progress Bar */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Total Classes */}
          <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#9BAFCB] uppercase tracking-wider">
              Total Classes
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#F4F7FF] font-mono">
                {overallStats.totalClasses}
              </span>
              <span className="text-xs text-[#9BAFCB]">Recorded</span>
            </div>
          </div>

          {/* Metric 2: Present Classes */}
          <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg flex flex-col justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Present Classes</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                {overallStats.presentClasses}
              </span>
              <span className="text-xs text-[#9BAFCB]">Attended</span>
            </div>
          </div>

          {/* Metric 3: Absent Classes */}
          <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg flex flex-col justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Absent Classes</span>
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">
                {overallStats.absentClasses}
              </span>
              <span className="text-xs text-[#9BAFCB]">Missed</span>
            </div>
          </div>

          {/* Metric 4: Overall Percentage */}
          <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#00D9FF] uppercase tracking-wider">
              Overall Percentage
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  overallStats.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {overallStats.percentage}%
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  overallStats.percentage >= 75
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {overallStats.percentage >= 75 ? 'Eligible (≥75%)' : 'Below 75% Target'}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar with 75% Criteria Marker */}
        <div className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F4F7FF] flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#00D9FF]" />
              <span>Campus Attendance Progress</span>
            </span>
            <span className="font-mono text-[#9BAFCB]">
              Target: <strong className="text-[#F4F7FF]">75%</strong>
            </span>
          </div>

          {/* Progress Track */}
          <div className="relative w-full h-3 bg-[#030E1F] rounded-full overflow-hidden border border-[#17365C]">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                overallStats.percentage >= 75
                  ? 'bg-gradient-to-r from-[#087BFF] to-[#00D9FF]'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallStats.percentage))}%` }}
            />
          </div>

          {/* Progress Bar Footer Labels */}
          <div className="flex items-center justify-between text-[11px] text-[#9BAFCB] font-mono">
            <span>0%</span>
            <span className="text-[#00D9FF] font-semibold">75% Target Criteria</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. ATTENDANCE INSIGHTS (Section 8) */}
      {/* ===================================================================== */}
      {overallStats.hasRecords && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F7FF]">Attendance Insights</h3>
              <p className="text-xs text-[#9BAFCB]">
                Mathematical projection based on your current recorded classes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Insight 1: Current vs Target */}
            <div className="p-4 rounded-xl bg-[#030E1F] border border-[#17365C] space-y-1.5">
              <span className="text-[#9BAFCB] font-medium block">Current vs 75% Target</span>
              <p className="text-base font-bold font-mono text-[#F4F7FF]">
                {overallStats.percentage}%{' '}
                <span
                  className={
                    overallStats.diffFromTarget >= 0 ? 'text-emerald-400 text-xs' : 'text-rose-400 text-xs'
                  }
                >
                  ({overallStats.diffFromTarget >= 0 ? `+${overallStats.diffFromTarget}%` : `${overallStats.diffFromTarget}%`})
                </span>
              </p>
              <p className="text-[11px] text-[#9BAFCB]">
                {overallStats.percentage >= 75
                  ? 'Your attendance exceeds university eligibility criteria.'
                  : 'Currently short of the 75% mandatory threshold.'}
              </p>
            </div>

            {/* Insight 2: Recovery / Retention Projection */}
            <div className="p-4 rounded-xl bg-[#030E1F] border border-[#17365C] space-y-1.5 md:col-span-2">
              <span className="text-[#9BAFCB] font-medium block">Eligibility Projection</span>
              {overallStats.percentage >= 75 ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Eligible for semester examinations!</span>
                  </p>
                  <p className="text-xs text-[#9BAFCB]">
                    You can miss up to{' '}
                    <strong className="text-[#F4F7FF] font-mono">{overallStats.canMiss}</strong> upcoming
                    classes while still maintaining at least 75% attendance.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Need {overallStats.consecutiveNeeded} consecutive Present class
                      {overallStats.consecutiveNeeded === 1 ? '' : 'es'}
                    </span>
                  </p>
                  <p className="text-xs text-[#9BAFCB]">
                    Attend the next{' '}
                    <strong className="text-[#00D9FF] font-mono">
                      {overallStats.consecutiveNeeded}
                    </strong>{' '}
                    classes consecutively without absence to bring your attendance back to 75%.
                  </p>
                </div>
              )}
              <span className="text-[10px] text-[#9BAFCB]/70 block italic pt-1">
                Note: Projections are computed strictly as mathematical estimates.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MARK ATTENDANCE INTERFACE (Section 5) */}
      {/* ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#17365C]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#087BFF]/15 text-[#00D9FF]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F7FF]">Mark Class Attendance</h3>
              <p className="text-xs text-[#9BAFCB]">
                Record your daily attendance status. Only one record per subject per date is stored.
              </p>
            </div>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#9BAFCB] space-y-2">
            <BookOpen className="w-6 h-6 mx-auto text-[#17365C]" />
            <p>Please add at least one subject below before marking attendance.</p>
          </div>
        ) : (
          <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Subject Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Select Subject <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={markSubjectId}
                onChange={(e) => setMarkSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-[#020B1A] text-white">
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Select */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Class Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#061830] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            {/* Status Choice (Present or Absent Toggle Buttons) */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#9BAFCB] mb-1.5">
                Status
              </label>
              <div className="flex rounded-xl bg-[#061830] p-1 border border-[#17365C]">
                <button
                  type="button"
                  onClick={() => setMarkStatus('Present')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    markStatus === 'Present'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMarkStatus('Absent')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    markStatus === 'Absent'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Absent</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submittingAttendance}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submittingAttendance ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{submittingAttendance ? 'Saving Attendance...' : 'Save Attendance'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. MY SUBJECTS (Section 4) */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00D9FF]" />
            <h3 className="text-sm font-bold text-[#F4F7FF] uppercase tracking-wider">
              My Subjects ({subjects.length})
            </h3>
          </div>
          <span className="text-xs text-[#9BAFCB]">
            Click any subject to view detailed logs and history
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#071B35]/50 border border-[#17365C] text-xs text-[#9BAFCB] space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-[#17365C]" />
            <p className="font-semibold text-[#F4F7FF]">No subjects added yet.</p>
            <p>Click &quot;Add Subject&quot; above to add your semester courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const stat = subjectStatsMap.get(sub.id) || {
                total: 0,
                present: 0,
                absent: 0,
                percentage: 0,
              };

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubjectDetails(sub)}
                  className="p-5 rounded-2xl bg-[#071B35] border border-[#17365C] hover:border-[#00D9FF]/40 transition-all cursor-pointer shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Subject Code Badge & Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                        {sub.code || 'CORE'}
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubject(sub);
                            setEditSubName(sub.name);
                            setEditSubCode(sub.code || '');
                          }}
                          className="p-1 text-[#9BAFCB] hover:text-[#00D9FF] rounded transition"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(sub)}
                          className="p-1 text-[#9BAFCB] hover:text-rose-400 rounded transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subject Name */}
                    <h4 className="text-base font-bold text-[#F4F7FF] group-hover:text-[#00D9FF] transition line-clamp-1">
                      {sub.name}
                    </h4>

                    {/* Counts Row */}
                    <div className="flex items-center justify-between text-xs text-[#9BAFCB] mt-3">
                      <span>{stat.present} Present</span>
                      <span>•</span>
                      <span>{stat.absent} Absent</span>
                      <span>•</span>
                      <span>{stat.total} Total</span>
                    </div>

                    {/* Subject Percentage & Progress Bar */}
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#9BAFCB]">Attendance</span>
                        <span
                          className={`font-bold ${
                            stat.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {stat.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#030E1F] rounded-full overflow-hidden border border-[#17365C]/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stat.percentage >= 75
                              ? 'bg-gradient-to-r from-[#087BFF] to-[#00D9FF]'
                              : 'bg-gradient-to-r from-amber-500 to-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, stat.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3 mt-4 border-t border-[#17365C] flex items-center justify-between text-[11px] text-[#00D9FF]">
                    <span>View Attendance Logs</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. SUBJECT DETAILS DRAWER / MODAL (Section 6) */}
      {/* ===================================================================== */}
      {selectedSubjectDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#071B35] border border-[#17365C] p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#17365C] pb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                  {selectedSubjectDetails.code || 'COURSE LOG'}
                </span>
                <h3 className="text-xl font-bold text-[#F4F7FF] mt-1">
                  {selectedSubjectDetails.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubjectDetails(null)}
                className="text-[#9BAFCB] hover:text-[#F4F7FF] p-1.5 rounded-lg hover:bg-[#030E1F] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Specific Metric Cards */}
            {(() => {
              const detailsStat = subjectStatsMap.get(selectedSubjectDetails.id) || {
                total: 0,
                present: 0,
                absent: 0,
                percentage: 0,
              };
              const subRecords = records
                .filter((r) => r.subject_id === selectedSubjectDetails.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-center">
                      <span className="text-[11px] text-[#9BAFCB]">Total Classes</span>
                      <p className="text-xl font-extrabold font-mono text-[#F4F7FF] mt-0.5">
                        {detailsStat.total}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-center">
                      <span className="text-[11px] text-emerald-400">Present</span>
                      <p className="text-xl font-extrabold font-mono text-emerald-400 mt-0.5">
                        {detailsStat.present}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-center">
                      <span className="text-[11px] text-rose-400">Absent</span>
                      <p className="text-xl font-extrabold font-mono text-rose-400 mt-0.5">
                        {detailsStat.absent}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-center">
                      <span className="text-[11px] text-[#00D9FF]">Percentage</span>
                      <p
                        className={`text-xl font-extrabold font-mono mt-0.5 ${
                          detailsStat.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {detailsStat.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-[#9BAFCB]">
                      <span>Course Attendance Rate</span>
                      <span>Target: 75%</span>
                    </div>
                    <div className="w-full h-2 bg-[#030E1F] rounded-full overflow-hidden border border-[#17365C]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          detailsStat.percentage >= 75
                            ? 'bg-gradient-to-r from-[#087BFF] to-[#00D9FF]'
                            : 'bg-gradient-to-r from-amber-500 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, detailsStat.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* History of this subject */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#F4F7FF] uppercase tracking-wider">
                      Course Log History ({subRecords.length})
                    </h4>

                    {subRecords.length === 0 ? (
                      <p className="text-xs text-[#9BAFCB] text-center py-6">
                        No attendance recorded yet for this subject.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {subRecords.map((r) => (
                          <div
                            key={r.id}
                            className="p-3 rounded-xl bg-[#030E1F] border border-[#17365C] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="w-3.5 h-3.5 text-[#9BAFCB]" />
                              <span className="font-mono text-[#F4F7FF]">
                                {new Date(r.date).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  r.status?.toLowerCase() === 'present'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {r.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickToggleRecord(r)}
                                className="p-1 text-[#9BAFCB] hover:text-[#00D9FF] rounded"
                                title="Toggle Status"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(r)}
                                className="p-1 text-[#9BAFCB] hover:text-rose-400 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-[#17365C] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubjectDetails(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#030E1F] border border-[#17365C] text-[#F4F7FF] hover:bg-[#061830] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. ATTENDANCE HISTORY LIST & FILTERS (Section 7) */}
      {/* ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#071B35] border border-[#17365C] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#17365C]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#00D9FF]" />
            <h3 className="text-sm font-bold text-[#F4F7FF]">Attendance History</h3>
          </div>

          {/* Simple Filters: All, Present, Absent, Subject Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="flex rounded-xl bg-[#030E1F] p-1 border border-[#17365C] text-xs">
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  historyStatusFilter === 'all'
                    ? 'bg-[#087BFF] text-white font-semibold'
                    : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
                }`}
              >
                All ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('Present')}
                className={`px-3 py-1 rounded-lg transition ${
                  historyStatusFilter === 'Present'
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
                }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('Absent')}
                className={`px-3 py-1 rounded-lg transition ${
                  historyStatusFilter === 'Absent'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
                }`}
              >
                Absent
              </button>
            </div>

            {/* Filter by Subject Dropdown */}
            {subjects.length > 0 && (
              <select
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#030E1F] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* History Table / List */}
        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9BAFCB] space-y-2">
            <Clock className="w-8 h-8 mx-auto text-[#17365C]" />
            <p className="font-semibold text-[#F4F7FF]">No attendance records found.</p>
            <p>Use the &quot;Mark Class Attendance&quot; form above to log your classes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#17365C] text-[#9BAFCB] uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17365C]/60">
                {filteredRecords.map((r) => {
                  const sub = subjects.find((s) => s.id === r.subject_id);
                  const isPresent = r.status?.toLowerCase() === 'present';

                  return (
                    <tr key={r.id} className="hover:bg-[#030E1F]/50 transition">
                      <td className="py-3 px-3 font-mono text-[#F4F7FF]">
                        {new Date(r.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#F4F7FF]">
                          {sub?.name || 'Unknown Subject'}
                        </span>
                        {sub?.code && (
                          <span className="ml-2 text-[10px] font-mono text-[#00D9FF] px-1.5 py-0.5 rounded bg-[#00D9FF]/10">
                            {sub.code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPresent
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPresent ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{isPresent ? 'Present' : 'Absent'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(r);
                              setEditRecordStatus(isPresent ? 'Present' : 'Absent');
                              setEditRecordDate(r.date);
                            }}
                            className="p-1.5 text-[#9BAFCB] hover:text-[#00D9FF] rounded hover:bg-[#061830] transition"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r)}
                            className="p-1.5 text-[#9BAFCB] hover:text-rose-400 rounded hover:bg-[#061830] transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#071B35] border border-[#17365C] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#17365C] pb-3">
              <h3 className="text-sm font-bold text-[#F4F7FF]">Edit Attendance Record</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-[#9BAFCB] hover:text-[#F4F7FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRecordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#9BAFCB] mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editRecordDate}
                  onChange={(e) => setEditRecordDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#061830] border border-[#17365C] text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFCB] mb-1">Status</label>
                <div className="flex rounded-xl bg-[#061830] p-1 border border-[#17365C]">
                  <button
                    type="button"
                    onClick={() => setEditRecordStatus('Present')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                      editRecordStatus === 'Present'
                        ? 'bg-emerald-500 text-white'
                        : 'text-[#9BAFCB]'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRecordStatus('Absent')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                      editRecordStatus === 'Absent'
                        ? 'bg-rose-500 text-white'
                        : 'text-[#9BAFCB]'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#17365C]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-1.5 rounded-xl text-[#9BAFCB] bg-[#030E1F] border border-[#17365C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditRecord}
                  className="px-4 py-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingEditRecord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
