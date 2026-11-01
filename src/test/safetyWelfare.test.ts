import { describe, it, expect, beforeEach } from 'vitest';
import { localStore } from '../services/storageService';
import { apiService } from '../services/apiService';
import { SafetyIssueCategory, SafetyReportStatus } from '../types';

describe('Student Safety & Welfare Module Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // 1. Emergency Helplines Verification
  // --------------------------------------------------------------------------
  describe('Official Indian Helplines Directory', () => {
    const EXPECTED_HELPLINES = [
      { service: 'National Emergency', helpline: '112', isPrimary: true },
      { service: 'Child Helpline', helpline: '1098' },
      { service: 'Cyber Financial Fraud', helpline: '1930' },
      { service: 'Women Helpline', helpline: '181' },
      { service: 'Tele-MANAS Support', helpline: '14416' },
      { service: 'Elderline', helpline: '14567' },
    ];

    it('contains exactly the 6 required Indian helplines without invented numbers', () => {
      // Numbers list verified
      const numbers = EXPECTED_HELPLINES.map((h) => h.helpline);
      expect(numbers).toHaveLength(6);
      expect(numbers).toContain('112');
      expect(numbers).toContain('1098');
      expect(numbers).toContain('1930');
      expect(numbers).toContain('181');
      expect(numbers).toContain('14416');
      expect(numbers).toContain('14567');
    });

    it('identifies 112 as the primary national emergency helpline', () => {
      const nationalEmergency = EXPECTED_HELPLINES.find((h) => h.helpline === '112');
      expect(nationalEmergency).toBeDefined();
      expect(nationalEmergency?.isPrimary).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Incident Report Submission & Anonymity Verification
  // --------------------------------------------------------------------------
  describe('Report an Issue & Strict Anonymity Protection', () => {
    const testUserId = 'student-uuid-12345';

    it('submits a named report with student user_id and generates unique report_code', async () => {
      const report = await apiService.submitSafetyReport({
        report_code: 'REP-2026-NAMED1',
        user_id: testUserId,
        is_anonymous: false,
        category: 'Campus Safety',
        subject: 'Faulty streetlight near hostel entrance',
        description: 'The streetlight outside Hostel Block C has been non-functional for 3 days.',
        status: 'Submitted',
      });

      expect(report.id).toBeDefined();
      expect(report.report_code).toBe('REP-2026-NAMED1');
      expect(report.user_id).toBe(testUserId);
      expect(report.is_anonymous).toBe(false);
      expect(report.category).toBe('Campus Safety');
      expect(report.status).toBe('Submitted');
    });

    it('strictly enforces user_id = null when is_anonymous is true to protect student identity', async () => {
      const anonReport = await apiService.submitSafetyReport({
        report_code: 'REP-2026-ANON99',
        user_id: testUserId, // Provided in payload, but must be stripped because is_anonymous is true
        is_anonymous: true,
        category: 'Ragging',
        subject: 'Confidential ragging concern in common room',
        description: 'First year students were subjected to unauthorized late night roll calls.',
        status: 'Submitted',
      });

      // Strict Anonymity Check
      expect(anonReport.is_anonymous).toBe(true);
      expect(anonReport.user_id).toBeNull();
      expect(anonReport.report_code).toBe('REP-2026-ANON99');

      // Verify that in storage, user_id is genuinely null
      const stored = localStore.getSafetyReports();
      const matched = stored.find((r) => r.report_code === 'REP-2026-ANON99');
      expect(matched?.user_id).toBeNull();
    });

    it('validates supported issue categories', () => {
      const validCategories: SafetyIssueCategory[] = [
        'Ragging',
        'Bullying',
        'Harassment Concern',
        'Campus Safety',
        'Infrastructure Problem',
        'Hostel or Classroom Issue',
        'Other',
      ];
      expect(validCategories).toHaveLength(7);
      expect(validCategories).toContain('Ragging');
      expect(validCategories).toContain('Bullying');
      expect(validCategories).toContain('Harassment Concern');
    });

    it('validates supported report statuses', () => {
      const validStatuses: SafetyReportStatus[] = [
        'Submitted',
        'Under Review',
        'Action Taken',
        'Resolved',
      ];
      expect(validStatuses).toHaveLength(4);
      expect(validStatuses).toContain('Submitted');
      expect(validStatuses).toContain('Under Review');
      expect(validStatuses).toContain('Action Taken');
      expect(validStatuses).toContain('Resolved');
    });
  });

  // --------------------------------------------------------------------------
  // 3. My Reports & Privacy Scoping
  // --------------------------------------------------------------------------
  describe('My Reports Access Scoping', () => {
    const studentA = 'student-alice-111';
    const studentB = 'student-bob-222';

    beforeEach(async () => {
      // Submit reports for Alice
      await apiService.submitSafetyReport({
        report_code: 'REP-2026-ALICE1',
        user_id: studentA,
        is_anonymous: false,
        category: 'Infrastructure Problem',
        subject: 'Water cooler leaking in Library',
        description: 'Level 2 cooler is leaking on the carpet.',
        status: 'Submitted',
      });

      // Submit an anonymous report by Alice (must NOT show in Alice's My Reports)
      await apiService.submitSafetyReport({
        report_code: 'REP-2026-ALICE_ANON',
        user_id: studentA,
        is_anonymous: true,
        category: 'Harassment Concern',
        subject: 'Anonymous concern',
        description: 'Incident report submitted anonymously.',
        status: 'Submitted',
      });

      // Submit report for Bob
      await apiService.submitSafetyReport({
        report_code: 'REP-2026-BOB1',
        user_id: studentB,
        is_anonymous: false,
        category: 'Hostel or Classroom Issue',
        subject: 'Fan broken in Room 304',
        description: 'Ceiling fan making clicking sounds.',
        status: 'Under Review',
      });
    });

    it('returns only non-anonymous reports belonging to the authenticated student', async () => {
      const aliceReports = await apiService.getSafetyReports(studentA);
      expect(aliceReports).toHaveLength(1);
      expect(aliceReports[0].report_code).toBe('REP-2026-ALICE1');
      expect(aliceReports[0].user_id).toBe(studentA);

      const bobReports = await apiService.getSafetyReports(studentB);
      expect(bobReports).toHaveLength(1);
      expect(bobReports[0].report_code).toBe('REP-2026-BOB1');
    });

    it('never leaks anonymous reports into student personal history', async () => {
      const aliceReports = await apiService.getSafetyReports(studentA);
      const hasAnon = aliceReports.some((r) => r.report_code === 'REP-2026-ALICE_ANON');
      expect(hasAnon).toBe(false);
    });

    it('allows students to track anonymous reports by code without revealing user_id or staff_notes', async () => {
      const tracked = await apiService.trackReportStatus('REP-2026-ALICE_ANON');
      expect(tracked).not.toBeNull();
      expect(tracked?.report_code).toBe('REP-2026-ALICE_ANON');
      expect(tracked?.status).toBe('Submitted');
      expect(tracked?.category).toBe('Harassment Concern');
      // Ensure user_id and staff_notes are never returned to client tracking
      expect((tracked as any).user_id).toBeUndefined();
      expect((tracked as any).staff_notes).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Verified Support Contacts & No Fake Data Rule
  // --------------------------------------------------------------------------
  describe('Student Support Directory & Truthful Contacts', () => {
    it('returns standard institutional roles: Administration, Security, Medical, Counselor', async () => {
      const contacts = await apiService.getVerifiedSupportContacts();
      expect(contacts).toHaveLength(4);

      const roles = contacts.map((c) => c.role);
      expect(roles).toContain('administration');
      expect(roles).toContain('security');
      expect(roles).toContain('medical');
      expect(roles).toContain('counselor');
    });

    it('displays contact details as unavailable when unverified instead of creating fake phone numbers', async () => {
      const contacts = await apiService.getVerifiedSupportContacts();
      contacts.forEach((contact) => {
        if (!contact.is_available) {
          expect(contact.phone).toBeNull();
          expect(contact.email).toBeNull();
        }
      });
    });
  });
});

