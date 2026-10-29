import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Filter,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Subject, AttendanceRecord, SubjectAttendanceStat } from '../../types';

export const AttendanceManager: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [historySearchDate, setHistorySearchDate] = useState<string>('');

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubInstructor, setNewSubInstructor] = useState('');
  const [newSubTarget, setNewSubTarget] = useState('75');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subs, atts] = await Promise.all([
        apiService.getSubjects(user.id),
        apiService.getAttendanceRecords(user.id),
      ]);
      setSubjects(subs);
      setRecords(atts);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Dynamic calculated statistics per subject
  const subjectStats: SubjectAttendanceStat[] = useMemo(() => {
    return apiService.calculateSubjectStats(subjects, records);
  }, [subjects, records]);

  // Overall attendance calculation
  const overallStat = useMemo(() => {
    let totalPresent = 0;
    let totalClasses = 0;
    subjectStats.forEach((s) => {
      totalPresent += s.presentClasses;
      totalClasses += s.totalClasses;
    });
    const percentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 1000) / 10 : 100;
    return {
      totalPresent,
      totalClasses,
      percentage,
      isBelowTarget: percentage < 75,
    };
  }, [subjectStats]);

  // Handle Mark Attendance (with duplicate check / update)
  const handleMarkAttendance = async (
    subjectId: string,
    status: 'present' | 'absent',
    dateToMark: string = selectedDate
  ) => {
    if (!user) return;
    try {
      await apiService.recordAttendance(user.id, {
        subject_id: subjectId,
        date: dateToMark,
        status,
        notes: `Recorded via Quick Attendance Logger`,
      });
      await loadData();
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  // Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSubName.trim()) return;

    try {
      await apiService.addSubject(user.id, {
        name: newSubName.trim(),
        code: newSubCode.trim() || undefined,
        instructor: newSubInstructor.trim() || undefined,
        target_attendance_percentage: Number(newSubTarget) || 75,
      });
      setIsSubjectModalOpen(false);
      setNewSubName('');
      setNewSubCode('');
      setNewSubInstructor('');
      setNewSubTarget('75');
      await loadData();
    } catch (err) {
      console.error('Error adding subject:', err);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Delete subject "${name}" and all its logged attendance records?`)) return;
    try {
      await apiService.deleteSubject(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await apiService.deleteAttendanceRecord(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting attendance record:', err);
    }
  };

  // Filtered history records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSubject = selectedSubjectId === 'all' || r.subject_id === selectedSubjectId;
      const matchDate = !historySearchDate || r.date === historySearchDate;
      return matchSubject && matchDate;
    });
  }, [records, selectedSubjectId, historySearchDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Add Subject Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Attendance Manager & Course Eligibility
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track daily class attendance, prevent exam debarment with 75% target warnings, and maintain persistent audit logs.
          </p>
        </div>

        <button
          onClick={() => setIsSubjectModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white shadow-glow-cyan transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course / Subject</span>
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
            Overall Campus Attendance
          </span>
          <div className="text-3xl font-extrabold text-white font-mono mt-2 flex items-baseline gap-2">
            <span>{overallStat.percentage}%</span>
            <span className="text-xs font-normal text-slate-400 font-sans">
              ({overallStat.totalPresent} / {overallStat.totalClasses} classes)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {overallStat.isBelowTarget ? (
              <span className="text-amber-400 font-semibold">⚠️ Below mandatory 75% threshold</span>
            ) : (
              <span className="text-emerald-400 font-semibold">✓ In good standing for final exams</span>
            )}
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-violet-500/20">
          <span className="text-xs font-mono text-violet-400 uppercase tracking-wider block">
            Subjects at Risk (&lt;75%)
          </span>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {subjectStats.filter((s) => s.isBelowTarget).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Out of {subjects.length} total enrolled courses
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
            Attendance Formula
          </span>
          <div className="text-xs font-mono text-emerald-300 mt-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            Attendance % = (P / Total) × 100
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Strict exclusion of cancelled classes from denominator.
          </p>
        </div>
      </div>

      {/* Quick Mark Attendance for Selected Date */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Mark Attendance for Today or Past Date</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select date and click Present or Absent. Duplicates for the same day are updated automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Session Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>
        </div>

        {/* Subjects list for the selected date */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => {
            const todayRecord = records.find(
              (r) => r.subject_id === sub.id && r.date === selectedDate
            );
            const stat = subjectStats.find((s) => s.subject.id === sub.id);

            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-semibold">
                      {sub.code || 'CS'}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        (stat?.percentage || 0) < (sub.target_attendance_percentage || 75)
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {stat?.percentage || 100}%
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1">{sub.name}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{sub.instructor || 'Faculty Staff'}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px]">
                    Status:{' '}
                    {todayRecord ? (
                      <span
                        className={`font-mono font-bold capitalize ${
                          todayRecord.status === 'present' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {todayRecord.status}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">Not Marked</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMarkAttendance(sub.id, 'present', selectedDate)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        todayRecord?.status === 'present'
                          ? 'bg-emerald-500 text-white shadow-glow-blue'
                          : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(sub.id, 'absent', selectedDate)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        todayRecord?.status === 'absent'
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject-Wise Performance & Recovery Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Subject Eligibility & Target Recovery
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectStats.map((stat) => (
            <div
              key={stat.subject.id}
              className={`p-5 rounded-2xl glass-panel border transition ${
                stat.isBelowTarget ? 'border-amber-500/30 bg-amber-950/10' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {stat.subject.code || 'COURSE'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Target: {stat.subject.target_attendance_percentage}%
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{stat.subject.name}</h3>
                  <p className="text-xs text-slate-400">{stat.subject.instructor}</p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-extrabold font-mono ${stat.isBelowTarget ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stat.percentage}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {stat.presentClasses} of {stat.totalClasses} classes
                  </span>
                </div>
              </div>

              {/* Attendance Progress Line */}
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stat.percentage < 65 ? 'bg-rose-500' : stat.isBelowTarget ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, stat.percentage)}%` }}
                />
              </div>

              {/* Warning or Status Notice */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {stat.isBelowTarget ? (
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Need <strong>{stat.classesNeededForTarget}</strong> consecutive classes to reach {stat.subject.target_attendance_percentage}%!
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Eligible for final exams</span>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteSubject(stat.subject.id, stat.subject.name)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Remove Course"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History Audit Log */}
      <div className="rounded-2xl glass-panel border border-slate-800/80 overflow-hidden shadow-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Daily Attendance History Logs</h3>
            <p className="text-xs text-slate-400">Chronological audit trail of marked classes</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-xs"
            >
              <option value="all" className="bg-slate-900 text-white">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={historySearchDate}
              onChange={(e) => setHistorySearchDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
            />
            {historySearchDate && (
              <button
                onClick={() => setHistorySearchDate('')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.slice(0, 20).map((r) => {
                const sub = subjects.find((s) => s.id === r.subject_id);
                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-medium text-slate-100">
                      {sub?.name || 'Unknown Subject'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">{r.date}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                          r.status === 'present'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {r.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">{r.notes || '-'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remove Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Add Enrolled Course / Subject</h2>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus & Cloud Computing"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="CS-401"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Target %</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newSubTarget}
                    onChange={(e) => setNewSubTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Instructor / Professor</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. P. Sengupta"
                  value={newSubInstructor}
                  onChange={(e) => setNewSubInstructor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-cyan transition"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
