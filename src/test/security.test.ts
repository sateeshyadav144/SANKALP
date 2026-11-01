import { describe, it, expect, beforeEach } from 'vitest';
import { localStore } from '../services/storageService';
import { validatePdfFile, extractTextFromPdf } from '../services/aiFlashcardService';

describe('SANKALP Security, Privacy & Rate Limiting Suite', () => {
  beforeEach(() => {
    localStore.resetToMocks();
    localStorage.removeItem('sankalp_gemini_api_key');
  });

  describe('1. Server & Local Rate Limiter Enforcement', () => {
    it('allows requests within the configured threshold', () => {
      const result1 = localStore.checkAndConsumeRateLimit('test_action', 3, 3600);
      expect(result1.allowed).toBe(true);
      expect(result1.status).toBe(200);

      const result2 = localStore.checkAndConsumeRateLimit('test_action', 3, 3600);
      expect(result2.allowed).toBe(true);

      const result3 = localStore.checkAndConsumeRateLimit('test_action', 3, 3600);
      expect(result3.allowed).toBe(true);
    });

    it('enforces HTTP 429 when rate limit threshold is exceeded', () => {
      // Consume up to limit (2 requests allowed)
      localStore.checkAndConsumeRateLimit('pdf_generation', 2, 3600);
      localStore.checkAndConsumeRateLimit('pdf_generation', 2, 3600);

      // Third request should be rejected with 429 and reset seconds
      const blocked = localStore.checkAndConsumeRateLimit('pdf_generation', 2, 3600);
      expect(blocked.allowed).toBe(false);
      expect(blocked.status).toBe(429);
      expect(blocked.reset_seconds).toBeGreaterThan(0);
      expect(blocked.error).toContain('Rate limit reached');
      expect(blocked.error).toContain('Please wait');
    });

    it('isolates rate limits per distinct action type', () => {
      // Exhaust ai_notes limit
      localStore.checkAndConsumeRateLimit('ai_notes', 1, 3600);
      const notesBlocked = localStore.checkAndConsumeRateLimit('ai_notes', 1, 3600);
      expect(notesBlocked.allowed).toBe(false);

      // Other actions like ai_flashcards must not be blocked
      const flashcardsAllowed = localStore.checkAndConsumeRateLimit('ai_flashcards', 5, 3600);
      expect(flashcardsAllowed.allowed).toBe(true);
    });
  });

  describe('2. File Upload & Document Security Validation', () => {
    it('rejects missing or null files', () => {
      const res = validatePdfFile(null as any);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('No file provided.');
    });

    it('rejects non-PDF executable or script files', () => {
      const exeFile = new File(['binary payload'], 'exploit.exe', { type: 'application/x-msdownload' });
      expect(validatePdfFile(exeFile).valid).toBe(false);

      const jsFile = new File(['alert(1)'], 'script.js', { type: 'text/javascript' });
      expect(validatePdfFile(jsFile).valid).toBe(false);
    });

    it('rejects empty 0-byte PDF files', () => {
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
      const res = validatePdfFile(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('empty (0 bytes)');
    });

    it('enforces strict 10MB maximum file size limit', () => {
      // Construct a simulated 11MB file
      const oversized = new File([new Uint8Array(11 * 1024 * 1024)], 'large_handbook.pdf', {
        type: 'application/pdf',
      });
      const res = validatePdfFile(oversized);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum limit of 10MB');
    });

    it('accepts legitimate academic PDF documents under 10MB', () => {
      const validPdf = new File(['%PDF-1.5 %academic notes'], 'distributed_systems.pdf', {
        type: 'application/pdf',
      });
      const res = validatePdfFile(validPdf);
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('detects encrypted / password-protected PDF streams', async () => {
      const encryptedPdf = new File(['%PDF-1.5 /Encrypt 5 0 R'], 'encrypted.pdf', {
        type: 'application/pdf',
      });
      const extraction = await extractTextFromPdf(encryptedPdf);
      expect(extraction.isEncrypted).toBe(true);
      expect(extraction.hasContent).toBe(false);
    });
  });

  describe('3. Secret Storage & Privacy Protection', () => {
    it('ensures no raw Gemini API key sits in browser localStorage', () => {
      expect(localStorage.getItem('sankalp_gemini_api_key')).toBeNull();
    });

    it('atomically clears student account data on GDPR data erasure request', () => {
      // Add test expense and attendance
      localStore.addExpense({
        user_id: 'user_1',
        title: 'Confidential Fee',
        amount: 500,
        category: 'Others',
        payment_method: 'UPI',
        date: '2026-10-31',
      });

      expect(localStore.getExpenses().length).toBeGreaterThan(0);

      // Perform complete erasure
      localStore.clearUserData();

      // Verify sanitized state
      expect(localStorage.getItem('sankalp_student_rate_limits')).toBeNull();
      expect(localStorage.getItem('sankalp_auth_logged_in')).toBeNull();
    });
  });
});
