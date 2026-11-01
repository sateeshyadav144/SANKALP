// ==============================================================================
// SANKALP — PDF-Based Topic Extraction & Visuals Test Suite
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePdfUpload,
  extractPdfContent,
  extractTopicsHeuristic,
  generateHeuristicMermaid,
  recommendDiagramTypes,
  MAX_PDF_SIZE_BYTES,
} from '../services/pdfTopicService';
import { sanitizeMermaid } from '../utils/mermaidSanitizer';
import { localStore } from '../services/storageService';
import { ExtractedTopic, DiagramType } from '../types';

describe('PDF-Based AI Notes & Visuals Complete Workflow Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. PDF Upload & Validation Tests
  // ---------------------------------------------------------------------------
  describe('PDF Upload & File Validation', () => {
    it('rejects null or empty file selections', () => {
      const res = validatePdfUpload(null as any);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Please choose a PDF file');
    });

    it('rejects non-PDF files such as .txt or .docx', () => {
      const txtFile = new File(['Hello World'], 'notes.txt', { type: 'text/plain' });
      const res = validatePdfUpload(txtFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Only PDF files (.pdf) are supported');
    });

    it('rejects 0-byte empty PDF files', () => {
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
      const res = validatePdfUpload(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('empty (0 bytes)');
    });

    it('rejects PDF files exceeding the 10 MB limit', () => {
      const largeBytes = new Uint8Array(MAX_PDF_SIZE_BYTES + 1024);
      const largeFile = new File([largeBytes], 'oversized.pdf', { type: 'application/pdf' });
      const res = validatePdfUpload(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds the 10 MB limit');
    });

    it('approves valid PDF files within the 10 MB limit', () => {
      const validFile = new File(['%PDF-1.5 dummy content'], 'operating_systems.pdf', {
        type: 'application/pdf',
      });
      const res = validatePdfUpload(validFile);
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PDF Content Extraction & Multi-Page Parsing
  // ---------------------------------------------------------------------------
  describe('PDF Content & Security Extraction', () => {
    it('detects encrypted or password-protected PDFs', async () => {
      const encryptedPdfRaw = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Encrypt 3 0 R >>\nendobj';
      const file = new File([encryptedPdfRaw], 'protected_lecture.pdf', { type: 'application/pdf' });

      const result = await extractPdfContent(file);
      expect(result.isEncrypted).toBe(true);
      expect(result.hasContent).toBe(false);
      expect(result.error).toContain('password-protected');
    });

    it('extracts text chunks from BT...ET streams preserving page structure', async () => {
      const mockPdfStream = `
%PDF-1.4
1 0 obj
<< /Type /Page >>
BT
/F1 12 Tf
(Chapter 1: Operating System Fundamentals) Tj
(Operating systems manage hardware resources efficiently.) Tj
ET
endobj
2 0 obj
<< /Type /Page >>
BT
/F1 12 Tf
(1.1 Memory Management) Tj
(Logical and physical address translation utilizes page tables.) Tj
ET
endobj
`;
      const file = new File([mockPdfStream], 'os_notes.pdf', { type: 'application/pdf' });
      const result = await extractPdfContent(file);

      expect(result.hasContent).toBe(true);
      expect(result.pageCount).toBe(2);
      expect(result.fullText).toContain('Operating System Fundamentals');
      expect(result.fullText).toContain('Memory Management');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Topic & Subtopic Extraction Engine
  // ---------------------------------------------------------------------------
  describe('Topic and Subtopic Extraction', () => {
    it('identifies numbered topics, subtopics, and assigns accurate page references', () => {
      const mockExtraction = {
        fileName: 'os_lecture.pdf',
        fileSize: 45000,
        pageCount: 3,
        fullText: '1. Memory Management\n- Logical vs Physical Address\n- Paging and Page Tables\n\n2. Virtual Memory\n- Demand Paging\n- Page Replacement Algorithms\n\n3. Concurrency\n- Semaphores and Mutex',
        isEncrypted: false,
        hasContent: true,
        pages: [
          {
            pageNumber: 1,
            text: '1. Memory Management\n- Logical vs Physical Address\n- Paging and Page Tables\nDetailed discussion on frame allocation.',
            charCount: 120,
          },
          {
            pageNumber: 2,
            text: '2. Virtual Memory\n- Demand Paging\n- Page Replacement Algorithms\nVirtual memory separates user logical memory from physical storage.',
            charCount: 140,
          },
          {
            pageNumber: 3,
            text: '3. Concurrency\n- Semaphores and Mutex\nRace conditions occur when concurrent threads access shared state.',
            charCount: 130,
          },
        ],
      };

      const topics = extractTopicsHeuristic(mockExtraction, 'doc_test_1', 'usr_test');

      expect(topics.length).toBeGreaterThanOrEqual(3);
      expect(topics[0].topic_title).toContain('Memory Management');
      expect(topics[0].page_references).toContain(1);
      expect(topics[0].subtopics).toEqual(
        expect.arrayContaining(['Logical vs Physical Address', 'Paging and Page Tables'])
      );

      expect(topics[1].topic_title).toContain('Virtual Memory');
      expect(topics[1].page_references).toContain(2);
      expect(topics[1].subtopics).toEqual(
        expect.arrayContaining(['Demand Paging', 'Page Replacement Algorithms'])
      );
    });

    it('correctly recommends diagram types based on topic semantics', () => {
      const dbTopic = {
        title: 'Relational Database Schema & Entities',
        subtopics: ['Primary and Foreign Keys', 'Cardinality Relations'],
        content: 'Tables store entity attributes with one to many relational constraints.',
      };
      const dbRecs = recommendDiagramTypes(dbTopic);
      expect(dbRecs[0]).toBe('erDiagram');

      const protocolTopic = {
        title: 'TCP Connection Handshake Protocol',
        subtopics: ['SYN Flag', 'SYN-ACK Response', 'ACK Finalize'],
        content: 'Client-server sequence messages with acknowledgement sequence numbers.',
      };
      const protoRecs = recommendDiagramTypes(protocolTopic);
      expect(protoRecs).toContain('sequence');

      const archTopic = {
        title: 'Campus Microservices Architecture',
        subtopics: ['API Gateway', 'Auth Service', 'Database Cluster'],
        content: 'Layered tier structure with client and server components.',
      };
      const archRecs = recommendDiagramTypes(archTopic);
      expect(archRecs).toContain('block');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Visual Diagram Generation & Sanitization
  // ---------------------------------------------------------------------------
  describe('Visual Diagram Synthesis & Syntax Validation', () => {
    const sampleTopic: ExtractedTopic = {
      id: 'topic_1',
      document_id: 'doc_1',
      user_id: 'usr_1',
      topic_number: '1',
      topic_title: 'Authentication & Session Flow',
      subtopics: ['Credential Verification', 'Token Issuance', 'Database Lookup'],
      extracted_content: 'Students authenticate via encrypted password exchange to receive a signed JWT session.',
      page_references: [1, 2],
      display_order: 1,
    };

    it('generates a valid Flowchart diagram', () => {
      const code = generateHeuristicMermaid(sampleTopic, 'flowchart');
      expect(code).toMatch(/^flowchart TD/);
      expect(code).toContain('Authentication & Session Flow');
      expect(code).toContain('Credential Verification');
    });

    it('generates a valid Mind Map diagram', () => {
      const code = generateHeuristicMermaid(sampleTopic, 'mindmap');
      expect(code).toMatch(/^mindmap/);
      expect(code).toContain('Authentication & Session Flow');
    });

    it('generates a valid Sequence diagram', () => {
      const code = generateHeuristicMermaid(sampleTopic, 'sequence');
      expect(code).toMatch(/^sequenceDiagram/);
      expect(code).toContain('Student');
      expect(code).toContain('Campus Database');
    });

    it('generates a valid Block / System Architecture diagram', () => {
      const code = generateHeuristicMermaid(sampleTopic, 'block');
      expect(code).toMatch(/^flowchart TD/);
      expect(code).toContain('subgraph ClientLayer');
      expect(code).toContain('subgraph CoreLayer');
      expect(code).toContain('subgraph StorageLayer');
    });

    it('sanitizes unquoted cylinder shapes and unquoted arrow labels', () => {
      const problematicMermaid = `flowchart TD
      API["Gateway"] -->|1. Request Token| Auth["Auth Service"]
      Auth -->|2. Query| DB[(PostgreSQL + RLS)]`;

      const sanitized = sanitizeMermaid(problematicMermaid);
      expect(sanitized).toContain('-->|"1. Request Token"|');
      expect(sanitized).toContain('-->|"2. Query"|');
      expect(sanitized).toContain('DB[("PostgreSQL + RLS")]');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Document & Topic Persistence & Re-use
  // ---------------------------------------------------------------------------
  describe('Document & Topic Persistence', () => {
    it('persists source documents and allows re-loading without re-extraction', () => {
      const doc = {
        id: 'doc_persisted_1',
        user_id: 'usr_alice',
        file_name: 'Computer_Networks.pdf',
        file_size: 1048576,
        page_count: 5,
        processing_status: 'completed' as const,
      };

      localStore.saveSourceDocument(doc);
      const retrieved = localStore.getSourceDocuments();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].file_name).toBe('Computer_Networks.pdf');

      // Save extracted topics
      const topics: ExtractedTopic[] = [
        {
          id: 'top_1',
          document_id: doc.id,
          user_id: 'usr_alice',
          topic_number: '1',
          topic_title: 'OSI Reference Model',
          subtopics: ['Physical Layer', 'Data Link Layer', 'Network Layer'],
          extracted_content: 'Seven layer conceptual model for network communication.',
          page_references: [1, 2],
          display_order: 1,
        },
      ];

      localStore.saveExtractedTopics(topics);

      // Re-query topics for document
      const docTopics = localStore.getExtractedTopics(doc.id);
      expect(docTopics.length).toBe(1);
      expect(docTopics[0].topic_title).toBe('OSI Reference Model');
      expect(docTopics[0].subtopics).toContain('Network Layer');
    });

    it('saves diagrams tied to source documents and topic references', () => {
      const diagram = {
        user_id: 'usr_alice',
        document_id: 'doc_persisted_1',
        topic_id: 'top_1',
        title: 'OSI Model Architecture',
        subject: 'Computer_Networks.pdf',
        topic: 'OSI Reference Model',
        diagram_type: 'block' as DiagramType,
        mermaid_code: 'flowchart TD\nLayer7["Application"] --> Layer6["Presentation"]',
        page_references: '1, 2',
      };

      const saved = localStore.saveDiagram(diagram);
      expect(saved.id).toBeDefined();

      const allDiagrams = localStore.getDiagrams();
      const found = allDiagrams.find((d) => d.id === saved.id);
      expect(found).toBeDefined();
      expect(found?.document_id).toBe('doc_persisted_1');
      expect(found?.topic).toBe('OSI Reference Model');
      expect(found?.page_references).toBe('1, 2');
    });
  });
});

