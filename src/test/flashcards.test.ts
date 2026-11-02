import { describe, it, expect, beforeEach, vi } from 'vitest';
import zlib from 'node:zlib';
import { localStore } from '../services/storageService';
import { apiService } from '../services/apiService';
import {
  validatePdfFile,
  runHeuristicFlashcards,
  extractTextFromPdf,
  generateFlashcardsFromPdf,
} from '../services/aiFlashcardService';

describe('SANKALP AI Flashcards & Review System Suite', () => {
  const TEST_USER = 'student_test_101';
  const OTHER_USER = 'student_test_999';

  beforeEach(() => {
    // Reset localStore data to initial mocks before each test
    localStore.resetToMocks();
  });

  describe('Deck Management', () => {
    it('creates a new deck with title, subject, and description', () => {
      const newDeck = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'Compiler Design: Lexical Analysis',
        subject: 'Computer Science',
        description: 'DFAs, NFAs, and tokenization algorithms.',
      });

      expect(newDeck).toBeDefined();
      expect(newDeck.id).toBeDefined();
      expect(newDeck.title).toBe('Compiler Design: Lexical Analysis');
      expect(newDeck.subject).toBe('Computer Science');

      const decks = localStore.getDecks();
      const found = decks.find((d) => d.id === newDeck.id);
      expect(found).toBeDefined();
    });

    it('updates an existing deck', () => {
      const created = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'Initial Title',
      });

      const updated = localStore.saveDeck({
        id: created.id,
        user_id: TEST_USER,
        title: 'Updated Title',
        subject: 'Algorithms',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.subject).toBe('Algorithms');
    });

    it('deletes a deck and its associated cards', () => {
      const deck = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'To Be Deleted',
      });

      localStore.saveFlashcard({
        user_id: TEST_USER,
        deck_id: deck.id,
        subject: 'CS',
        topic: 'Temp',
        question: 'Q1',
        answer: 'A1',
      });

      expect(localStore.getFlashcards(deck.id).length).toBe(1);

      localStore.deleteDeck(deck.id);

      expect(localStore.getDecks().some((d) => d.id === deck.id)).toBe(false);
      expect(localStore.getFlashcards(deck.id).length).toBe(0);
    });
  });

  describe('Flashcard CRUD & Association', () => {
    it('saves cards with front question, back answer, hint and difficulty', () => {
      const deck = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'Operating Systems',
      });

      const card = localStore.saveFlashcard({
        user_id: TEST_USER,
        deck_id: deck.id,
        subject: 'Operating Systems',
        topic: 'Virtual Memory',
        question: 'What is Belady’s Anomaly in FIFO page replacement?',
        answer: 'Belady’s Anomaly describes the phenomenon where allocating more page frames results in an increase in page faults.',
        hint: 'FIFO page replacement edge case',
        difficulty: 'hard',
      });

      expect(card.id).toBeDefined();
      expect(card.deck_id).toBe(deck.id);
      expect(card.difficulty).toBe('hard');

      const retrieved = localStore.getFlashcards(deck.id);
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].question).toContain('Belady’s Anomaly');
    });

    it('batch saves generated cards linked to a deck', () => {
      const deck = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'Computer Networks',
      });

      const batch = [
        {
          user_id: TEST_USER,
          deck_id: deck.id,
          subject: 'Networks',
          topic: 'TCP',
          question: 'What flags are set during TCP 3-way handshake?',
          answer: 'SYN, SYN-ACK, ACK.',
        },
        {
          user_id: TEST_USER,
          deck_id: deck.id,
          subject: 'Networks',
          topic: 'OSI',
          question: 'What is the function of the Transport Layer?',
          answer: 'End-to-end communication, flow control, and error recovery.',
        },
      ];

      const saved = localStore.saveFlashcardsBatch(batch);
      expect(saved.length).toBe(2);

      const deckCards = localStore.getFlashcards(deck.id);
      expect(deckCards.length).toBe(2);
    });
  });

  describe('Review Decision Tracking & Mastery Formula', () => {
    it('records review status as known or revision with single active state per card', () => {
      const deck = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'Database Systems',
      });

      const card = localStore.saveFlashcard({
        user_id: TEST_USER,
        deck_id: deck.id,
        subject: 'DBMS',
        topic: 'ACID',
        question: 'What does ACID stand for?',
        answer: 'Atomicity, Consistency, Isolation, Durability.',
      });

      // 1. Mark as known
      const review1 = localStore.recordFlashcardReview(card.id, 'known', TEST_USER);
      expect(review1.status).toBe('known');
      expect(review1.card_id).toBe(card.id);

      let userReviews = localStore.getFlashcardReviews(TEST_USER);
      let cardReview = userReviews.find((r) => r.card_id === card.id);
      expect(cardReview?.status).toBe('known');

      // 2. Change status from known to revision
      const review2 = localStore.recordFlashcardReview(card.id, 'revision', TEST_USER);
      expect(review2.status).toBe('revision');

      userReviews = localStore.getFlashcardReviews(TEST_USER);
      // There should only be one active review entry for this user and card
      const matches = userReviews.filter((r) => r.card_id === card.id);
      expect(matches.length).toBe(1);
      expect(matches[0].status).toBe('revision');
    });

    it('accurately computes statistics, retention rate, and not reviewed counts', () => {
      const deck = localStore.saveDeck({
        user_id: TEST_USER,
        title: 'Software Engineering',
      });

      // Create 4 test cards
      const cards = [
        localStore.saveFlashcard({ user_id: TEST_USER, deck_id: deck.id, subject: 'SE', topic: 'Agile', question: 'Q1', answer: 'A1' }),
        localStore.saveFlashcard({ user_id: TEST_USER, deck_id: deck.id, subject: 'SE', topic: 'Agile', question: 'Q2', answer: 'A2' }),
        localStore.saveFlashcard({ user_id: TEST_USER, deck_id: deck.id, subject: 'SE', topic: 'Agile', question: 'Q3', answer: 'A3' }),
        localStore.saveFlashcard({ user_id: TEST_USER, deck_id: deck.id, subject: 'SE', topic: 'Agile', question: 'Q4', answer: 'A4' }),
      ];

      // Mark Card 0 and Card 1 as Known
      localStore.recordFlashcardReview(cards[0].id, 'known', TEST_USER);
      localStore.recordFlashcardReview(cards[1].id, 'known', TEST_USER);

      // Mark Card 2 as Need Revision
      localStore.recordFlashcardReview(cards[2].id, 'revision', TEST_USER);

      // Card 3 is unreviewed

      const userReviews = localStore.getFlashcardReviews(TEST_USER);
      const statusMap = new Map<string, 'known' | 'revision'>();
      userReviews.forEach((r) => statusMap.set(r.card_id, r.status));

      const total = cards.length;
      let known = 0;
      let revision = 0;

      cards.forEach((c) => {
        const st = statusMap.get(c.id);
        if (st === 'known') known++;
        else if (st === 'revision') revision++;
      });

      const reviewed = known + revision;
      const notReviewed = total - known - revision;
      const completionRate = Math.round((reviewed / total) * 100);
      const masteryRate = Math.round((known / total) * 100);

      expect(total).toBe(4);
      expect(known).toBe(2);
      expect(revision).toBe(1);
      expect(notReviewed).toBe(1);
      expect(reviewed).toBe(3);
      expect(completionRate).toBe(75);
      expect(masteryRate).toBe(50);
    });
  });

  describe('PDF Validator & Heuristic Generation', () => {
    it('validates PDF files correctly', () => {
      // Missing file
      expect(validatePdfFile(null as any).valid).toBe(false);

      // Non-PDF file
      const textFile = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
      expect(validatePdfFile(textFile).valid).toBe(false);

      // Empty PDF file
      const emptyPdf = new File([], 'empty.pdf', { type: 'application/pdf' });
      expect(validatePdfFile(emptyPdf).valid).toBe(false);

      // Valid PDF file
      const validPdf = new File(['%PDF-1.5 dummy content'], 'operating_systems.pdf', {
        type: 'application/pdf',
      });
      expect(validatePdfFile(validPdf).valid).toBe(true);
    });

    it('generates academic flashcards from text using heuristic parser', () => {
      const sampleLecture = `A Process Control Block is defined as a data structure used by computer operating systems to store all the information about a process.
Virtual Memory refers to a memory management capability of an operating system that uses hardware and software to allow a computer to compensate for physical memory shortages.
Thrashing occurs because a computer's virtual memory resources are overused, leading to a constant state of paging and page faults.`;

      const cards = runHeuristicFlashcards(
        sampleLecture,
        3,
        'Computer Science',
        'Operating Systems',
        'mixed'
      );

      expect(cards.length).toBe(3);
      expect(cards[0].question).toContain('Process Control Block');
      expect(cards[0].answer).toContain('data structure used by computer operating systems');
      expect(cards[1].question).toContain('Virtual Memory');
    });

    it('extracts text page-by-page from a compressed multi-page text PDF in exact page order', async () => {
      // Create a genuine 2-page FlateDecode-compressed PDF
      const p1Text = 'BT /F1 12 Tf (Page 1: Operating System Kernel Architecture and System Calls) Tj ET';
      const p2Text = 'BT /F1 12 Tf (Page 2: Concurrency, Semaphores, and Mutex Deadlock Prevention) Tj ET';

      const stream1 = zlib.deflateSync(Buffer.from(p1Text));
      const stream2 = zlib.deflateSync(Buffer.from(p2Text));

      const pdfParts = [
        '%PDF-1.5\n',
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 6 0 R >>\nendobj\n',
        '5 0 obj\n<< /Length ' + stream1.length + ' /Filter /FlateDecode >>\nstream\n',
        stream1,
        '\nendstream\nendobj\n',
        '6 0 obj\n<< /Length ' + stream2.length + ' /Filter /FlateDecode >>\nstream\n',
        stream2,
        '\nendstream\nendobj\n',
        'trailer\n<< /Size 7 /Root 1 0 R >>\n%%EOF',
      ];

      const fullBuffer = Buffer.concat(
        pdfParts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : p))
      );

      const file = new File([fullBuffer], 'os_text_lecture.pdf', { type: 'application/pdf' });
      const doc = await extractTextFromPdf(file);

      expect(doc.hasContent).toBe(true);
      expect(doc.isScanned).toBe(false);
      expect(doc.pageCount).toBe(2);
      expect(doc.pages[0].pageNumber).toBe(1);
      expect(doc.pages[0].text).toContain('Kernel Architecture');
      expect(doc.pages[1].pageNumber).toBe(2);
      expect(doc.pages[1].text).toContain('Deadlock Prevention');
      // Verifies page order is strictly preserved
      expect(doc.text.indexOf('Page 1')).toBeLessThan(doc.text.indexOf('Page 2'));
    });

    it('generates flashcards from a normal text-based PDF with progress updates', async () => {
      const p1Text = 'BT /F1 12 Tf (A Database Management System is defined as software designed to store, manage, and retrieve user data with security.) Tj ET';
      const stream = zlib.deflateSync(Buffer.from(p1Text));

      const pdfParts = [
        '%PDF-1.5\n',
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n',
        '4 0 obj\n<< /Length ' + stream.length + ' /Filter /FlateDecode >>\nstream\n',
        stream,
        '\nendstream\nendobj\n',
        'trailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF',
      ];

      const fullBuffer = Buffer.concat(
        pdfParts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : p))
      );

      const file = new File([fullBuffer], 'dbms_notes.pdf', { type: 'application/pdf' });
      const progressSteps: string[] = [];

      const cards = await generateFlashcardsFromPdf(
        {
          file,
          count: 2,
          difficulty: 'medium',
          language: 'English',
          deckTitle: 'Database Systems',
          subject: 'DBMS',
        },
        (step) => progressSteps.push(step)
      );

      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].question).toContain('Database Management System');
      expect(progressSteps.length).toBeGreaterThan(2);
    });

    it('detects scanned image PDF and reports clear configuration error when Gemini API proxy is unconfigured', async () => {
      // Scanned image PDF: Contains image stream but no readable text layer
      const imageBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const scannedPdfParts = [
        '%PDF-1.5\n',
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im1 4 0 R >> >> >>\nendobj\n',
        '4 0 obj\n<< /Type /XObject /Subtype /Image /Width 100 /Height 100 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ' +
          imageBytes.length +
          ' >>\nstream\n',
        imageBytes,
        '\nendstream\nendobj\n',
        'trailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF',
      ];

      const scannedBuffer = Buffer.concat(
        scannedPdfParts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : p))
      );

      const scannedFile = new File([scannedBuffer], 'scanned_handwritten_lecture.pdf', {
        type: 'application/pdf',
      });

      // Verify text extraction flags document as scanned
      const doc = await extractTextFromPdf(scannedFile);
      expect(doc.hasContent).toBe(false);
      expect(doc.isScanned).toBe(true);

      // Spy on invokeGeminiAi to simulate backend proxy without Gemini API key configured
      vi.spyOn(apiService, 'invokeGeminiAi').mockResolvedValueOnce({
        success: false,
        fallback_required: true,
        error: 'Server configuration error: GEMINI_API_KEY is not configured on the backend.',
      });

      await expect(
        generateFlashcardsFromPdf({
          file: scannedFile,
          count: 5,
          difficulty: 'mixed',
          language: 'English',
          deckTitle: 'Handwritten Notes',
        })
      ).rejects.toThrow(/Automatic visual OCR requires a configured Gemini API/i);
    });

    it('extracts text and synthesizes flashcards when Gemini OCR succeeds on scanned PDF', async () => {
      const scannedFile = new File(['%PDF-1.5 %scanned image document without text layer'], 'scanned_exam.pdf', {
        type: 'application/pdf',
      });

      // Simulate Gemini OCR succeeding with extracted academic text
      const simulatedOcrText = `--- Page 1 ---
Cache Memory is defined as a high-speed memory layer that stores frequently accessed CPU instructions to reduce latency.
--- Page 2 ---
Pipelining refers to an implementation technique where multiple computer instructions are overlapped in execution.`;

      vi.spyOn(apiService, 'invokeGeminiAi').mockImplementation(async (params: any) => {
        // First call: OCR prompt
        if (params.contents?.[0]?.parts?.some((p: any) => p.text?.includes('OCR'))) {
          return {
            success: true,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: simulatedOcrText }],
                  },
                },
              ],
            },
          };
        }
        // Second call: Flashcard synthesis
        return {
          success: true,
          data: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        {
                          question: 'What is Cache Memory?',
                          answer: 'High-speed memory layer storing frequently accessed instructions.',
                          hint: 'CPU memory hierarchy',
                          difficulty: 'easy',
                        },
                        {
                          question: 'What is Pipelining in computer architecture?',
                          answer: 'Technique where multiple instructions are overlapped in execution.',
                          hint: 'Instruction cycle overlap',
                          difficulty: 'medium',
                        },
                      ]),
                    },
                  ],
                },
              },
            ],
          },
        };
      });

      const cards = await generateFlashcardsFromPdf({
        file: scannedFile,
        count: 2,
        difficulty: 'medium',
        language: 'English',
        deckTitle: 'Computer Architecture',
      });

      expect(cards.length).toBe(2);
      expect(cards[0].question).toContain('Cache Memory');
      expect(cards[1].question).toContain('Pipelining');
    });
  });
});

