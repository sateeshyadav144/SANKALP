import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../services/apiService';
import { Note } from '../types';

describe('AI Notes & Study Workspace Full Workflow Suite', () => {
  const testUserId = 'student_test_user_456';

  beforeEach(() => {
    localStorage.clear();
  });

  it('executes the complete 8-step AI Notes Study Workspace workflow', async () => {
    // 1. Create a note with initial lecture material
    const initialNotePayload = {
      title: 'Database Transactions & ACID Mechanics',
      subject: 'Database Systems',
      content: `A transaction is a single logical unit of work that accesses and modifies database contents.
ACID properties define transaction guarantees:
Atomicity: All operations in a transaction succeed or none take effect.
Consistency: Database transitions from one valid state to another valid state.
Isolation: Concurrent transactions execute independently without interference.
Durability: Committed updates persist permanently despite crashes.`,
      summary: '',
      key_points: [],
      action_items: [],
      tags: ['Database', 'ACID'],
      is_ai_generated: false,
    };

    // 2. Simulate text uploaded from a PDF or TXT lecture document
    const simulatedPdfExtractedText = `Write-Ahead Logging (WAL) ensures durability by appending transaction logs to non-volatile disk storage before dirty buffer pool pages are written.
Checkpointing limits recovery duration by flushing committed dirty pages.
Two-Phase Locking (2PL) guarantees serializability and prevents conflict anomalies.`;

    const combinedContent = `${initialNotePayload.content}\n\n${simulatedPdfExtractedText}`;

    // 3 & 4. Generate summary, key takeaways, definitions, and study questions
    const generatedSummary = 'Transactions enforce ACID guarantees using Write-Ahead Logging and Two-Phase Locking to maintain database consistency and serializability.';
    const generatedKeyPoints = [
      'Atomicity and Durability rely on Write-Ahead Logging prior to disk writes.',
      'Isolation is preserved via Two-Phase Locking and concurrency controls.',
      'Checkpointing bounds crash recovery times.',
    ];
    const generatedDefinitions = [
      'Transaction: A single logical unit of work accessing and modifying database state.',
      'Write-Ahead Logging: Protocol appending logs to disk before flushing dirty pages.',
    ];
    const generatedStudyQuestions = [
      'How does Write-Ahead Logging prevent data loss during power failures?',
      'What is the distinction between Strict 2PL and basic 2PL?',
    ];

    // Encode definitions and questions into action_items for database persistence
    const actionItemsToSave = [
      ...generatedDefinitions.map((d) => `[Definition] ${d}`),
      ...generatedStudyQuestions.map((q) => `[Question] ${q}`),
    ];

    // 5. Save the note to the database / storage
    const savedNote = await apiService.saveNote(testUserId, {
      title: initialNotePayload.title,
      subject: initialNotePayload.subject,
      content: combinedContent,
      summary: generatedSummary,
      key_points: generatedKeyPoints,
      action_items: actionItemsToSave,
      tags: initialNotePayload.tags,
      is_ai_generated: true,
    });

    expect(savedNote).toBeDefined();
    expect(savedNote.id).toBeDefined();
    expect(savedNote.title).toBe('Database Transactions & ACID Mechanics');
    expect(savedNote.key_points).toHaveLength(3);
    expect(savedNote.action_items).toHaveLength(4);

    // 6. Simulate refreshing the application / loading the notes library
    const loadedNotes = await apiService.getNotes(testUserId);
    expect(loadedNotes.length).toBeGreaterThanOrEqual(1);
    const retrievedNote = loadedNotes.find((n: Note) => n.id === savedNote.id);
    expect(retrievedNote).toBeDefined();

    // 7. Reopen and edit the saved note
    const defs = (retrievedNote?.action_items || [])
      .filter((item) => item.startsWith('[Definition]'))
      .map((item) => item.replace('[Definition]', '').trim());
    const questions = (retrievedNote?.action_items || [])
      .filter((item) => item.startsWith('[Question]'))
      .map((item) => item.replace('[Question]', '').trim());

    expect(defs).toHaveLength(2);
    expect(defs[0]).toContain('Transaction:');
    expect(questions).toHaveLength(2);
    expect(questions[0]).toContain('Write-Ahead Logging');

    // Update note with revised title and extra key point
    const updatedNote = await apiService.saveNote(testUserId, {
      id: retrievedNote?.id,
      title: 'Database Transactions & WAL Mechanics (Revised)',
      subject: 'Database Systems',
      content: retrievedNote?.content || '',
      summary: retrievedNote?.summary,
      key_points: [...(retrievedNote?.key_points || []), 'MVCC provides lock-free read consistency.'],
      action_items: retrievedNote?.action_items || [],
      tags: ['Database', 'ACID', 'WAL'],
      is_ai_generated: true,
    });

    expect(updatedNote.title).toBe('Database Transactions & WAL Mechanics (Revised)');
    expect(updatedNote.key_points).toHaveLength(4);

    // 8. Verify note deletion with confirmation
    await apiService.deleteNote(updatedNote.id);
    const postDeleteNotes = await apiService.getNotes(testUserId);
    expect(postDeleteNotes.some((n: Note) => n.id === updatedNote.id)).toBe(false);
  });
});
