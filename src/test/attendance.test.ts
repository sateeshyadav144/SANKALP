import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../services/apiService';
import { localStore } from '../services/storageService';
import { Subject, AttendanceRecord } from '../types';

describe('Attendance Calculation & Duplicate Prevention Suite', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
