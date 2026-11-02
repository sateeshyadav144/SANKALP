import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../services/apiService';
import { localStore } from '../services/storageService';
import { Subject, AttendanceRecord } from '../types';

describe('Attendance Calculation & Duplicate Prevention Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts completely empty by default for any new user with zero mock subjects or records', () => {
    const subjects = localStore.getSubjects('fresh_user_001');
    const attendance = localStore.getAttendance('fresh_user_001');

    expect(subjects).toEqual([]);
    expect(attendance).toEqual([]);
    expect(subjects.length).toBe(0);
    expect(attendance.length).toBe(0);
  });

  it('strictly isolates subjects and attendance records between different users', () => {
    // User 1 adds a subject and an attendance mark
    const sub1 = localStore.addSubject({
      user_id: 'user_alpha',
      name: 'Distributed Systems',
      code: 'CS502',
    });

    const rec1 = localStore.recordAttendance({
      user_id: 'user_alpha',
      subject_id: sub1.id,
      date: '2026-11-01',
      status: 'Present',
    });

    // User 2 queries their subjects and records
    const subjectsBeta = localStore.getSubjects('user_beta');
    const recordsBeta = localStore.getAttendance('user_beta');

    expect(subjectsBeta.length).toBe(0);
    expect(recordsBeta.length).toBe(0);

    // User 1 queries their subjects and records
    const subjectsAlpha = localStore.getSubjects('user_alpha');
    const recordsAlpha = localStore.getAttendance('user_alpha');

    expect(subjectsAlpha.length).toBe(1);
    expect(subjectsAlpha[0].id).toBe(sub1.id);
    expect(recordsAlpha.length).toBe(1);
    expect(recordsAlpha[0].id).toBe(rec1.id);
  });

  it('calculates subject attendance percentages accurately with target warning', () => {
    const subjects: Subject[] = [
      {
        id: 'sub_test_1',
        user_id: 'user_1',
        name: 'Algorithms',
        target_attendance_percentage: 80,
      },
    ];

    // 6 present, 4 absent = 60%
    const records: AttendanceRecord[] = [
      { id: '1', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-01', status: 'present' },
      { id: '2', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-02', status: 'present' },
      { id: '3', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-03', status: 'present' },
      { id: '4', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-04', status: 'present' },
      { id: '5', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-05', status: 'present' },
      { id: '6', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-06', status: 'present' },
      { id: '7', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-07', status: 'absent' },
      { id: '8', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-08', status: 'absent' },
      { id: '9', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-09', status: 'absent' },
      { id: '10', user_id: 'user_1', subject_id: 'sub_test_1', date: '2026-10-10', status: 'absent' },
    ];

    const stats = apiService.calculateSubjectStats(subjects, records);
    expect(stats.length).toBe(1);
    expect(stats[0].totalClasses).toBe(10);
    expect(stats[0].presentClasses).toBe(6);
    expect(stats[0].percentage).toBe(60);
    expect(stats[0].isBelowTarget).toBe(true);

    // Target formula check: To reach 80% with 6 present out of 10:
    // (6 + x) / (10 + x) >= 0.8
    // 6 + x >= 8 + 0.8x
    // 0.2x >= 2
    // x >= 10
    expect(stats[0].classesNeededForTarget).toBe(10);
  });

  it('prevents duplicate attendance records for the same subject and date', () => {
    // Record first attendance
    const rec1 = localStore.recordAttendance({
      user_id: 'user_1',
      subject_id: 'sub_101',
      date: '2026-10-29',
      status: 'absent',
      notes: 'Initial entry',
    });

    const allBefore = localStore.getAttendance();
    const countBefore = allBefore.filter(
      (a) => a.subject_id === 'sub_101' && a.date === '2026-10-29'
    ).length;
    expect(countBefore).toBe(1);

    // Attempt duplicate entry for same subject and date, with updated status 'present'
    const rec2 = localStore.recordAttendance({
      user_id: 'user_1',
      subject_id: 'sub_101',
      date: '2026-10-29',
      status: 'present',
      notes: 'Updated entry',
    });

    const allAfter = localStore.getAttendance();
    const matches = allAfter.filter(
      (a) => a.subject_id === 'sub_101' && a.date === '2026-10-29'
    );

    // Uniqueness must be preserved: length remains 1, status updated to present
    expect(matches.length).toBe(1);
    expect(matches[0].status).toBe('present');
    expect(matches[0].notes).toBe('Updated entry');
  });

  it('handles 0 total classes gracefully with 0% attendance', () => {
    const subjects: Subject[] = [
      {
        id: 'sub_empty',
        user_id: 'user_1',
        name: 'Quantum Computing',
        code: 'QC101',
      },
    ];

    const stats = apiService.calculateSubjectStats(subjects, []);
    expect(stats.length).toBe(1);
    expect(stats[0].totalClasses).toBe(0);
    expect(stats[0].presentClasses).toBe(0);
    expect(stats[0].percentage).toBe(0);
  });

  it('calculates 75% target projection formulas correctly for below and above target', () => {
    // Below 75%: 6 present out of 10 = 60%
    // Formula: N = max(0, ceil(3T - 4P)) = 3*10 - 4*6 = 30 - 24 = 6 consecutive present classes needed
    const T_below = 10;
    const P_below = 6;
    const needed = Math.max(0, Math.ceil(3 * T_below - 4 * P_below));
    expect(needed).toBe(6);
    // Verification: (6 + 6) / (10 + 6) = 12 / 16 = 75%
    expect((P_below + needed) / (T_below + needed)).toBe(0.75);

    // Above 75%: 16 present out of 20 = 80%
    // Formula: M = max(0, floor((4P - 3T) / 3)) = floor((64 - 60) / 3) = floor(4/3) = 1 missable class
    const T_above = 20;
    const P_above = 16;
    const canMiss = Math.max(0, Math.floor((4 * P_above - 3 * T_above) / 3));
    expect(canMiss).toBe(1);
    // Verification: 16 / (20 + 1) = 16 / 21 = 76.19% >= 75%
    expect(P_above / (T_above + canMiss)).toBeGreaterThanOrEqual(0.75);
  });

  it('prevents duplicate subject creation for the same student (case-insensitive)', () => {
    const s1 = localStore.addSubject({
      user_id: 'student_123',
      name: 'Computer Networks',
      code: 'CS401',
    });
    expect(s1.id).toBeDefined();

    expect(() => {
      localStore.addSubject({
        user_id: 'student_123',
        name: 'computer networks', // same name, different casing
        code: 'CS401_B',
      });
    }).toThrow(/already exists/i);
  });

  it('cascades subject deletion to remove related attendance records', () => {
    const sub = localStore.addSubject({
      user_id: 'student_cascade',
      name: 'Compiler Design',
      code: 'CS601',
    });

    localStore.recordAttendance({
      user_id: 'student_cascade',
      subject_id: sub.id,
      date: '2026-10-28',
      status: 'Present',
    });
    localStore.recordAttendance({
      user_id: 'student_cascade',
      subject_id: sub.id,
      date: '2026-10-29',
      status: 'Absent',
    });

    expect(localStore.getAttendance().filter((a) => a.subject_id === sub.id).length).toBe(2);

    localStore.deleteSubject(sub.id);

    expect(localStore.getSubjects().find((s) => s.id === sub.id)).toBeUndefined();
    expect(localStore.getAttendance().filter((a) => a.subject_id === sub.id).length).toBe(0);
  });
});
