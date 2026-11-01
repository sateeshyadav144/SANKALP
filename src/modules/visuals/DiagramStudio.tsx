// ==============================================================================
// SANKALP — Notes & Visuals (PDF-Based AI Topic Extraction & Visual Generator)
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import {
  FileText,
  Upload,
  Search,
  Save,
  Download,
  Trash2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Layers,
  Code2,
  ChevronDown,
  ChevronRight,
  FileCode,
  Network,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Diagram,
  DiagramType,
  SourceDocument,
  ExtractedTopic,
} from '../../types';
import { sanitizeMermaid } from '../../utils/mermaidSanitizer';
import {
  validatePdfUpload,
  extractPdfContent,
  extractTopicsFromPdf,
  generateDiagramForTopic,
  recommendDiagramTypes,
} from '../../services/pdfTopicService';

// Initialize Mermaid with SANKALP clean dark palette
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      darkMode: true,
      background: '#030E1F',
      primaryColor: '#071B35',
      primaryTextColor: '#F4F7FF',
      primaryBorderColor: '#00D9FF',
      lineColor: '#00D9FF',
      secondaryColor: '#081F3D',
      tertiaryColor: '#061329',
    },
    securityLevel: 'strict',
  });
} catch (e) {
  console.warn('Mermaid initialization:', e);
}

// -----------------------------------------------------------------------------
// Diagram Type Metadata Catalog (10 Visual Types)
// -----------------------------------------------------------------------------
export const DIAGRAM_TYPES_CATALOG: Array<{
  type: DiagramType;
  label: string;
  category: string;
  description: string;
}> = [
  { type: 'flowchart', label: 'Flowchart', category: 'Process', description: 'Step-by-step algorithms, decision branches & execution pipelines' },
  { type: 'mindmap', label: 'Mind Map', category: 'Conceptual', description: 'Hierarchical concept trees, taxonomies & revision branches' },
  { type: 'block', label: 'Block Diagram', category: 'Systems', description: 'Modular system subsystems, layered hardware & component blocks' },
  { type: 'concept', label: 'Concept Diagram', category: 'Conceptual', description: 'Semantic concept nodes & relational dependency flows' },
  { type: 'sequence', label: 'Sequence Diagram', category: 'Protocols', description: 'Ordered message flows, client-server calls & TCP/API handshakes' },
  { type: 'usecase', label: 'UML Use Case', category: 'Modeling', description: 'Actor roles, boundary scopes & system interaction goals' },
  { type: 'classDiagram', label: 'UML Class Diagram', category: 'Modeling', description: 'Object-oriented classes, attributes, methods & inheritance' },
  { type: 'erDiagram', label: 'ER Diagram', category: 'Database', description: 'Entity schemas, primary/foreign keys & cardinalities' },
  { type: 'dfd', label: 'Data Flow Diagram', category: 'Process', description: 'Data streams, transformation processes & persistent stores' },
  { type: 'architecture', label: 'System Architecture', category: 'Systems', description: 'Multi-tier system topology, microservices & cloud layers' },
];

export interface DiagramTemplate {
  id: string;
  name: string;
  subject: string;
  type: DiagramType;
  description: string;
  code: string;
}

export const ARCHITECTURE_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'auth_flow',
    name: 'Microservice Authentication Flow',
    subject: 'Computer Science',
    type: 'flowchart',
    description: 'OAuth2 JWT token exchange with API Gateway and Database RLS',
    code: `flowchart TD
    Client["Web / Mobile Client"] -->|"1. Credentials"| Gateway["Sankalp API Gateway"]
    Gateway -->|"2. Verify"| Auth["Supabase Auth Service"]
    Auth -->|"3. Signed JWT"| Client
    Client -->|"4. Bearer Token"| Gateway
    Gateway -->|"5. Service Request"| Microservice["Campus Services"]
    Microservice -->|"6. RLS Query (auth.uid)"| DB[("PostgreSQL + RLS")]
    DB -->|"7. Isolated Student Data"| Microservice
    Microservice -->|"8. Secure Response"| Client`,
  },
  {
    id: 'os_lifecycle',
    name: 'Operating System Process Lifecycle',
    subject: 'Operating Systems',
    type: 'stateDiagram',
    description: 'States from process creation to scheduler dispatch and CPU preemption',
    code: `stateDiagram-v2
    [*] --> New: fork() / create
    New --> Ready: Admitted to Scheduler
    Ready --> Running: CPU Dispatch
    Running --> Ready: Preemption / Timer
    Running --> Waiting: I/O or Event Wait
    Waiting --> Ready: I/O Complete
    Running --> Terminated: exit()
    Terminated --> [*]`,
  },
  {
    id: 'tcp_handshake',
    name: 'TCP 3-Way Handshake',
    subject: 'Computer Networks',
    type: 'sequence',
    description: 'Synchronize and Acknowledge sequence numbers between Client and Host',
    code: `sequenceDiagram
    autonumber
    actor Client as Client Host
    actor Server as Campus Server
    Client->>Server: SYN (Sequence = X)
    Note over Server: Allocate buffer & socket
    Server->>Client: SYN-ACK (Seq = Y, Ack = X+1)
    Note over Client: Allocate TCP control block
    Client->>Server: ACK (Seq = X+1, Ack = Y+1)
    Note over Client,Server: Connection ESTABLISHED`,
  },
  {
    id: 'domain_model',
    name: 'University Academic Domain Model',
    subject: 'Software Engineering',
    type: 'classDiagram',
    description: 'Object-oriented relations between Students, Courses, and Attendance',
    code: `classDiagram
    class Student {
      +UUID id
      +String fullName
      +String rollNumber
      +registerCourse()
      +markAttendance()
    }
    class Course {
      +UUID id
      +String name
      +String code
      +Float targetPercentage
    }
    class AttendanceRecord {
      +UUID id
      +Date date
      +String status
    }
    Student "1" --> "*" Course : enrolls in
    Course "1" --> "*" AttendanceRecord : logs`,
  },
];

type StudioMode = 'pdf_workflow' | 'saved_library' | 'templates';
type PdfStage = 'upload' | 'topics' | 'visualize';

export const DiagramStudio: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_guest';

  // Navigation mode & PDF workflow stage
  const [studioMode, setStudioMode] = useState<StudioMode>('pdf_workflow');
  const [pdfStage, setPdfStage] = useState<PdfStage>('upload');

  // PDF Document & Extraction state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<SourceDocument | null>(null);
  const [pastDocuments, setPastDocuments] = useState<SourceDocument[]>([]);

  // Topics state
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ExtractedTopic | null>(null);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());

  // Visual Workspace state
  const [selectedDiagramType, setSelectedDiagramType] = useState<DiagramType>('flowchart');
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [diagramSvg, setDiagramSvg] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);

  // Saved diagrams state
  const [savedDiagrams, setSavedDiagrams] = useState<Diagram[]>([]);
  const [isSavingDiagram, setIsSavingDiagram] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // File input ref for drag & drop or click
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Load: Fetch saved diagrams and previously uploaded documents
  useEffect(() => {
    loadSavedDiagrams();
    loadPastDocuments();
  }, [userId]);

  const loadSavedDiagrams = async () => {
    try {
      const diagrams = await apiService.getDiagrams(userId);
      setSavedDiagrams(diagrams);
    } catch (e) {
      console.warn('Failed to load saved diagrams:', e);
    }
  };

  const loadPastDocuments = async () => {
    try {
      const docs = await apiService.getSourceDocuments(userId);
      setPastDocuments(docs);
    } catch (e) {
      console.warn('Failed to load past documents:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 1 & 2: PDF Upload & Extraction
  // ---------------------------------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedPdf(file);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedPdf(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processSelectedPdf = async (file: File) => {
    setPdfError(null);
    const validation = validatePdfUpload(file);
    if (!validation.valid) {
      setPdfError(validation.error || 'Invalid PDF file.');
      return;
    }

    setSelectedFile(file);
    setIsProcessingPdf(true);
    setProcessingStatusText('Reading and validating PDF byte stream...');

    try {
      // Step 2: Extract text per page
      setProcessingStatusText('Extracting readable pages and headings...');
      const extraction = await extractPdfContent(file);

      if (!extraction.hasContent) {
        setPdfError(extraction.error || 'Could not extract readable text from this document.');
        setIsProcessingPdf(false);
        return;
      }

      // Save document record to DB
      const docId = `doc_${Date.now()}`;
      const docRecord: SourceDocument = {
        id: docId,
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        page_count: extraction.pageCount,
        processing_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await apiService.saveSourceDocument(userId, docRecord);
      setActiveDocument(docRecord);

      // Step 3: Identify topics & subtopics
      setProcessingStatusText('Analyzing structure, topics and page references with AI...');
      const topics = await extractTopicsFromPdf(extraction, docId, userId);

      if (!topics || topics.length === 0) {
        setPdfError('No academic topics could be identified from the uploaded text.');
        setIsProcessingPdf(false);
        return;
      }

      // Save topics in DB for instant persistence
      await apiService.saveExtractedTopics(topics);
      setExtractedTopics(topics);

      // Auto-expand all topics initially
      setExpandedTopicIds(new Set(topics.map((t) => t.id)));

      // Refresh documents list
      await loadPastDocuments();

      // Advance to Stage 2: Topic Selection
      setPdfStage('topics');
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setPdfError(err?.message || 'Failed to process PDF notes. Please check the file and try again.');
    } finally {
      setIsProcessingPdf(false);
      setProcessingStatusText('');
    }
  };

  // Re-open a previously processed document without re-extracting
  const handleSelectPastDocument = async (doc: SourceDocument) => {
    setIsProcessingPdf(true);
    setPdfError(null);
    setProcessingStatusText(`Loading cached topics for ${doc.file_name}...`);
    try {
      const cachedTopics = await apiService.getExtractedTopics(doc.id);
      if (cachedTopics && cachedTopics.length > 0) {
        setActiveDocument(doc);
        setExtractedTopics(cachedTopics);
        setExpandedTopicIds(new Set(cachedTopics.map((t) => t.id)));
        setPdfStage('topics');
      } else {
        setPdfError('No cached topics found for this document. Please re-upload.');
      }
    } catch (e: any) {
      setPdfError(e?.message || 'Failed to retrieve document topics.');
    } finally {
      setIsProcessingPdf(false);
      setProcessingStatusText('');
    }
  };

  const handleResetUpload = () => {
    setSelectedFile(null);
    setActiveDocument(null);
    setExtractedTopics([]);
    setSelectedTopic(null);
    setPdfError(null);
    setPdfStage('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 4 & 5: Topic Selection & Workspace Navigation
  // ---------------------------------------------------------------------------
  const toggleTopicExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectTopic = (topic: ExtractedTopic) => {
    setSelectedTopic(topic);
    // Pick the best recommended diagram type for this topic
    const recommended = topic.suggested_diagram_types || recommendDiagramTypes({
      title: topic.topic_title,
      subtopics: topic.subtopics,
      content: topic.extracted_content,
    });
    const defaultType = recommended[0] || 'flowchart';
    setSelectedDiagramType(defaultType);

    // Advance to Stage 3: Visual Generation
    setPdfStage('visualize');

    // Trigger visual generation for this topic
    handleGenerateVisual(topic, defaultType);
  };

  // ---------------------------------------------------------------------------
  // STEP 6 & 7: Generate Visual Using AI
  // ---------------------------------------------------------------------------
  const handleGenerateVisual = async (
    topic: ExtractedTopic = selectedTopic!,
    type: DiagramType = selectedDiagramType
  ) => {
    if (!topic) return;
    setIsGeneratingVisual(true);
    setRenderError(null);
    setSaveSuccessMsg(null);

    try {
      const code = await generateDiagramForTopic(topic, type);
      const sanitized = sanitizeMermaid(code);
      setMermaidCode(sanitized);
      await renderMermaidCode(sanitized);
    } catch (err: any) {
      console.error('Visual generation error:', err);
      setRenderError(err?.message || 'Failed to synthesize diagram.');
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 8: Render & Preview
  // ---------------------------------------------------------------------------
  const renderMermaidCode = async (codeToRender: string) => {
    if (!codeToRender.trim()) {
      setDiagramSvg(null);
      return;
    }

    const uniqueId = `mermaid_diagram_${Date.now()}`;
    try {
      const cleanCode = sanitizeMermaid(codeToRender);
      const { svg } = await mermaid.render(uniqueId, cleanCode);
      setDiagramSvg(svg);
      setRenderError(null);
    } catch (err: any) {
      console.warn('Mermaid rendering error:', err);
      setRenderError(err?.message || 'Mermaid syntax error. Click "Edit Source" to modify code.');
      const stray = document.getElementById(uniqueId);
      if (stray) stray.remove();
    }
  };

  // Live code edit handler from modal
  const handleApplyCodeEdit = async () => {
    await renderMermaidCode(mermaidCode);
    setIsCodeEditorOpen(false);
  };

  // ---------------------------------------------------------------------------
  // STEP 9: Save or Export Diagram
  // ---------------------------------------------------------------------------
  const handleSaveDiagram = async () => {
    if (!mermaidCode.trim() || isSavingDiagram) return;
    setIsSavingDiagram(true);
    setSaveSuccessMsg(null);

    const title = selectedTopic ? selectedTopic.topic_title : 'Study Architecture Diagram';
    const pageRefs = selectedTopic ? selectedTopic.page_references.join(', ') : '';

    try {
      await apiService.saveDiagram(userId, {
        document_id: activeDocument?.id,
        topic_id: selectedTopic?.id,
        title,
        subject: activeDocument?.file_name || 'General Notes',
        topic: selectedTopic?.topic_title || 'Visual Summary',
        diagram_type: selectedDiagramType,
        mermaid_code: sanitizeMermaid(mermaidCode),
        description: `Visual generated from PDF: ${activeDocument?.file_name || 'Study Notes'} (Pages: ${pageRefs || '1'})`,
        page_references: pageRefs,
      });

      setSaveSuccessMsg('Visual saved successfully to your Campus Library!');
      await loadSavedDiagrams();
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Save diagram error:', err);
      alert('Could not save diagram to library. Please check your connection.');
    } finally {
      setIsSavingDiagram(false);
    }
  };

  const handleExportSvg = () => {
    if (!diagramSvg) return;
    const blob = new Blob([diagramSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (selectedTopic?.topic_title || 'diagram').toLowerCase().replace(/[^\w-]/g, '_');
    link.download = `${cleanName}_${selectedDiagramType}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!diagramSvg) return;
    const svgBlob = new Blob([diagramSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(800, (img.width || 800) * 2);
      canvas.height = Math.max(600, (img.height || 600) * 2);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#030E1F';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        const cleanName = (selectedTopic?.topic_title || 'diagram').toLowerCase().replace(/[^\w-]/g, '_');
        link.download = `${cleanName}_${selectedDiagramType}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleDeleteSavedDiagram = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved diagram?')) return;
    try {
      await apiService.deleteDiagram(id);
      setSavedDiagrams((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.warn('Failed to delete diagram:', err);
    }
  };

  const handleOpenSavedDiagram = (diagram: Diagram) => {
    setSelectedDiagramType(diagram.diagram_type);
    setMermaidCode(diagram.mermaid_code);
    renderMermaidCode(diagram.mermaid_code);
    setSelectedTopic({
      id: diagram.topic_id || 'saved_topic',
      document_id: diagram.document_id || 'saved_doc',
      user_id: userId,
      topic_number: '',
      topic_title: diagram.title,
      subtopics: [],
      extracted_content: diagram.description || 'Saved from student campus library.',
      page_references: diagram.page_references
        ? String(diagram.page_references).split(',').map(Number).filter((n) => !isNaN(n))
        : [],
      display_order: 1,
    });
    setStudioMode('pdf_workflow');
    setPdfStage('visualize');
  };

  const handleApplyTemplate = (template: DiagramTemplate) => {
    setSelectedDiagramType(template.type);
    setMermaidCode(template.code);
    renderMermaidCode(template.code);
    setSelectedTopic({
      id: template.id,
      document_id: 'template_doc',
      user_id: userId,
      topic_number: '',
      topic_title: template.name,
      subtopics: [template.subject],
      extracted_content: template.description,
      page_references: [1],
      display_order: 1,
    });
    setStudioMode('pdf_workflow');
    setPdfStage('visualize');
  };

  // Filter topics by real-time search query
  const filteredTopics = extractedTopics.filter((t) => {
    if (!topicSearchQuery.trim()) return true;
    const q = topicSearchQuery.toLowerCase();
    return (
      t.topic_title.toLowerCase().includes(q) ||
      t.subtopics.some((s) => s.toLowerCase().includes(q)) ||
      t.extracted_content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* =================================================================== */}
      {/* 1. HEADER & MODE SWITCHER                                           */}
      {/* =================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#17365C]/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F4F7FF] tracking-tight">
              Notes & Visuals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30">
              PDF AI Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#9BAFCB] mt-1">
            Extract academic topics from lecture notes and synthesize interactive visual diagrams.
          </p>
        </div>

        {/* Top View Selector: PDF Visuals | Saved Library | Templates */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStudioMode('pdf_workflow');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              studioMode === 'pdf_workflow'
                ? 'bg-[#00D9FF] text-[#020B1A] shadow-md shadow-[#00D9FF]/20'
                : 'bg-[#061830] text-[#9BAFCB] border border-[#17365C] hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>PDF to Visuals</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('saved_library')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              studioMode === 'saved_library'
                ? 'bg-[#00D9FF] text-[#020B1A] shadow-md shadow-[#00D9FF]/20'
                : 'bg-[#061830] text-[#9BAFCB] border border-[#17365C] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Saved Visuals ({savedDiagrams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('templates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              studioMode === 'templates'
                ? 'bg-[#00D9FF] text-[#020B1A] shadow-md shadow-[#00D9FF]/20'
                : 'bg-[#061830] text-[#9BAFCB] border border-[#17365C] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. PDF WORKFLOW (3 STAGES: Upload -> Select Topic -> Visualize)     */}
      {/* =================================================================== */}
      {studioMode === 'pdf_workflow' && (
        <div className="space-y-6">
          {/* 3-Step Breadcrumb Progress Bar */}
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5 rounded-2xl bg-[#061830]/70 border border-[#17365C]/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPdfStage('upload')}
              className={`flex items-center gap-2 transition ${
                pdfStage === 'upload'
                  ? 'text-[#00D9FF]'
                  : activeDocument
                  ? 'text-[#F4F7FF] hover:text-[#00D9FF]'
                  : 'text-[#9BAFCB]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  pdfStage === 'upload'
                    ? 'bg-[#00D9FF] text-[#020B1A]'
                    : activeDocument
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#030E1F] text-[#9BAFCB] border border-[#17365C]'
                }`}
              >
                1
              </div>
              <span>Upload PDF</span>
            </button>

            <div className="h-[1px] w-12 bg-[#17365C]" />

            <button
              type="button"
              disabled={!activeDocument || extractedTopics.length === 0}
              onClick={() => setPdfStage('topics')}
              className={`flex items-center gap-2 transition disabled:opacity-40 ${
                pdfStage === 'topics'
                  ? 'text-[#00D9FF]'
                  : selectedTopic
                  ? 'text-[#F4F7FF] hover:text-[#00D9FF]'
                  : 'text-[#9BAFCB]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  pdfStage === 'topics'
                    ? 'bg-[#00D9FF] text-[#020B1A]'
                    : selectedTopic
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#030E1F] text-[#9BAFCB] border border-[#17365C]'
                }`}
              >
                2
              </div>
              <span>Select Topic</span>
            </button>

            <div className="h-[1px] w-12 bg-[#17365C]" />

            <button
              type="button"
              disabled={!selectedTopic}
              onClick={() => setPdfStage('visualize')}
              className={`flex items-center gap-2 transition disabled:opacity-40 ${
                pdfStage === 'visualize' ? 'text-[#00D9FF]' : 'text-[#9BAFCB]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  pdfStage === 'visualize'
                    ? 'bg-[#00D9FF] text-[#020B1A]'
                    : 'bg-[#030E1F] text-[#9BAFCB] border border-[#17365C]'
                }`}
              >
                3
              </div>
              <span>Generate Visual</span>
            </button>
          </div>

          {/* =============================================================== */}
          {/* STAGE 1: PDF UPLOAD INTERFACE                                   */}
          {/* =============================================================== */}
          {pdfStage === 'upload' && (
            <div className="space-y-6">
              {/* Drag-and-drop Card */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !isProcessingPdf && fileInputRef.current?.click()}
                className={`relative rounded-3xl p-8 sm:p-12 border-2 border-dashed transition text-center cursor-pointer ${
                  isProcessingPdf
                    ? 'border-[#00D9FF]/50 bg-[#061830]/40 cursor-wait'
                    : 'border-[#17365C] hover:border-[#00D9FF]/70 bg-[#061830]/60 hover:bg-[#061830]/90 shadow-xl'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessingPdf}
                />

                <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.15)]">
                    {isProcessingPdf ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isProcessingPdf ? 'Analyzing PDF Notes...' : selectedFile ? selectedFile.name : 'Upload Study Notes PDF'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9BAFCB] mt-1">
                      {isProcessingPdf
                        ? processingStatusText
                        : selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click to replace file`
                        : 'Drag and drop your lecture notes or syllabus PDF here, or click to browse'}
                    </p>
                  </div>

                  {!isProcessingPdf && (
                    <div className="flex items-center gap-3 text-xs text-[#9BAFCB]">
                      <span>Maximum File Size: 10 MB</span>
                      <span>•</span>
                      <span>Supports multi-page text notes</span>
                    </div>
                  )}

                  {isProcessingPdf && (
                    <div className="w-full max-w-xs pt-2">
                      <div className="w-full bg-[#030E1F] h-2 rounded-full overflow-hidden border border-[#17365C]">
                        <div className="h-full bg-gradient-to-r from-[#00D9FF] to-[#087BFF] animate-pulse w-3/4 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {pdfError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs sm:text-sm text-rose-300">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-rose-200">Unable to Process Document</p>
                    <p>{pdfError}</p>
                  </div>
                </div>
              )}

              {/* Previously Uploaded Documents */}
              {pastDocuments.length > 0 && (
                <div className="rounded-2xl bg-[#061830]/80 border border-[#17365C] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Previously Uploaded Notes</h4>
                      <p className="text-xs text-[#9BAFCB]">
                        Re-open extracted topics without re-processing the PDF.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pastDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectPastDocument(doc)}
                        className="p-3.5 rounded-xl bg-[#030E1F]/80 border border-[#17365C] hover:border-[#00D9FF]/50 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-[#00D9FF] transition">
                              {doc.file_name}
                            </p>
                            <p className="text-[11px] text-[#9BAFCB]">
                              {doc.page_count} pages • {(doc.file_size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            apiService.deleteSourceDocument(doc.id).then(loadPastDocuments);
                          }}
                          className="text-[#9BAFCB] hover:text-rose-400 transition p-1"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* STAGE 2: EXTRACTED TOPICS INTERFACE                             */}
          {/* =============================================================== */}
          {pdfStage === 'topics' && (
            <div className="space-y-6">
              {/* Document Overview Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#061830]/80 border border-[#17365C]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {activeDocument?.file_name || 'Study Notes Document'}
                    </h3>
                    <p className="text-xs text-[#9BAFCB]">
                      {activeDocument?.page_count || 1} pages parsed • {extractedTopics.length} distinct topics identified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetUpload}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9BAFCB] hover:text-white bg-[#030E1F] border border-[#17365C] transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Different PDF</span>
                  </button>
                </div>
              </div>

              {/* Search & Bulk Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#9BAFCB] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search extracted topics or subtopics..."
                    value={topicSearchQuery}
                    onChange={(e) => setTopicSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#061830] border border-[#17365C] text-xs sm:text-sm text-white placeholder-[#9BAFCB]/60 focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (expandedTopicIds.size === extractedTopics.length) {
                        setExpandedTopicIds(new Set());
                      } else {
                        setExpandedTopicIds(new Set(extractedTopics.map((t) => t.id)));
                      }
                    }}
                    className="text-xs text-[#9BAFCB] hover:text-[#00D9FF] transition px-2 py-1"
                  >
                    {expandedTopicIds.size === extractedTopics.length
                      ? 'Collapse All'
                      : 'Expand All'}
                  </button>
                </div>
              </div>

              {/* Topic List */}
              <div className="space-y-3">
                {filteredTopics.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#061830]/50 border border-[#17365C] text-xs text-[#9BAFCB]">
                    No topics match "{topicSearchQuery}". Clear search to view all topics.
                  </div>
                ) : (
                  filteredTopics.map((topic) => {
                    const isExpanded = expandedTopicIds.has(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className="rounded-2xl bg-[#061830]/80 border border-[#17365C] hover:border-[#00D9FF]/40 transition overflow-hidden shadow-md"
                      >
                        {/* Topic Row Header */}
                        <div
                          onClick={() => handleSelectTopic(topic)}
                          className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#081F3D]/40 transition group"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Expand/Collapse Chevron */}
                            <button
                              type="button"
                              onClick={(e) => toggleTopicExpand(topic.id, e)}
                              className="mt-0.5 sm:mt-0 p-1 rounded-lg text-[#9BAFCB] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 transition"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#00D9FF]">
                                  {topic.topic_number ? `${topic.topic_number}.` : ''}
                                </span>
                                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#00D9FF] transition truncate">
                                  {topic.topic_title}
                                </h4>
                                {topic.page_references.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#030E1F] text-[#9BAFCB] border border-[#17365C]">
                                    Page {topic.page_references.join(', ')}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[#9BAFCB] mt-1 line-clamp-1">
                                {topic.extracted_content}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTopic(topic);
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 hover:bg-[#00D9FF] hover:text-[#020B1A] transition shadow-sm flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Generate Visual</span>
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Subtopics List */}
                        {isExpanded && (
                          <div className="px-5 pb-4 pt-1 border-t border-[#17365C]/50 bg-[#030E1F]/50 space-y-2">
                            {topic.subtopics.length > 0 ? (
                              <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-[#9BAFCB] uppercase tracking-wider">
                                  Nested Subtopics:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {topic.subtopics.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-xs text-[#F4F7FF]"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF]" />
                                      <span>{sub}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-[#9BAFCB] italic">
                                Core concept section derived directly from page {topic.page_references.join(', ')}.
                              </p>
                            )}

                            {/* Extracted Excerpt */}
                            <div className="pt-2 text-[11px] text-[#9BAFCB]/80 font-mono bg-[#020B1A] p-2.5 rounded-lg border border-[#17365C]/40">
                              <span className="font-bold text-[#00D9FF]">Source Excerpt: </span>
                              {topic.extracted_content}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STAGE 3: TOPIC SELECTION & VISUAL WORKSPACE                     */}
          {/* =============================================================== */}
          {pdfStage === 'visualize' && selectedTopic && (
            <div className="space-y-6">
              {/* Top Navigation & Selected Topic Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#061830] border border-[#17365C]">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setPdfStage('topics')}
                    className="p-2 rounded-xl bg-[#030E1F] border border-[#17365C] text-[#9BAFCB] hover:text-white transition shrink-0"
                    title="Return to topic list without re-processing"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00D9FF]">
                        {selectedTopic.topic_number ? `Topic ${selectedTopic.topic_number}: ` : ''}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        {selectedTopic.topic_title}
                      </h2>
                      {selectedTopic.page_references.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#030E1F] text-[#9BAFCB] border border-[#17365C]">
                          Page {selectedTopic.page_references.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9BAFCB] mt-1 max-w-2xl line-clamp-2">
                      {selectedTopic.extracted_content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerateVisual()}
                    disabled={isGeneratingVisual}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#020B1A] bg-[#00D9FF] hover:bg-[#00D9FF]/90 transition shadow-md shadow-[#00D9FF]/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingVisual ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Regenerate Visual</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Diagram Type Selector (10 visual types with recommendations) */}
              <div className="p-4 rounded-2xl bg-[#061830]/80 border border-[#17365C] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Select Diagram Architecture:
                  </span>
                  <span className="text-[11px] text-[#9BAFCB]">
                    ★ Recommended types highlighted based on topic semantics
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {DIAGRAM_TYPES_CATALOG.map((item) => {
                    const isRecommended = selectedTopic.suggested_diagram_types?.includes(item.type);
                    const isSelected = selectedDiagramType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setSelectedDiagramType(item.type);
                          handleGenerateVisual(selectedTopic, item.type);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#00D9FF]/15 border-[#00D9FF] text-white shadow-[0_0_15px_rgba(0,217,255,0.15)]'
                            : 'bg-[#030E1F]/90 border-[#17365C] text-[#9BAFCB] hover:border-[#00D9FF]/40 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{item.label}</span>
                            {isRecommended && (
                              <span className="text-[9px] font-bold text-[#00D9FF]">★</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#9BAFCB]/80 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diagram Preview Canvas with Zoom and Controls */}
              <div className="rounded-3xl bg-[#030E1F] border border-[#17365C] overflow-hidden shadow-2xl space-y-0">
                {/* Canvas Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#17365C]/60 bg-[#061830]/90">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Visual Preview</span>
                    <span className="text-xs text-[#9BAFCB]">
                      • {DIAGRAM_TYPES_CATALOG.find((d) => d.type === selectedDiagramType)?.label}
                    </span>
                  </div>

                  {/* Actions: Zoom, Edit Source, Save, Export */}
                  <div className="flex items-center gap-2">
                    {/* Zoom In / Out / Reset */}
                    <div className="flex items-center rounded-xl bg-[#030E1F] border border-[#17365C] p-0.5">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                        className="p-1.5 text-[#9BAFCB] hover:text-white transition"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono px-2 text-[#9BAFCB]">
                        {zoomLevel}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                        className="p-1.5 text-[#9BAFCB] hover:text-white transition"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(100)}
                        className="p-1.5 text-[#9BAFCB] hover:text-white transition border-l border-[#17365C]/60"
                        title="Reset zoom"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Edit Source Code */}
                    <button
                      type="button"
                      onClick={() => setIsCodeEditorOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9BAFCB] hover:text-white bg-[#030E1F] border border-[#17365C] transition flex items-center gap-1.5"
                    >
                      <Code2 className="w-3.5 h-3.5 text-[#00D9FF]" />
                      <span>Edit Source</span>
                    </button>

                    {/* Export SVG */}
                    <button
                      type="button"
                      onClick={handleExportSvg}
                      disabled={!diagramSvg}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9BAFCB] hover:text-white bg-[#030E1F] border border-[#17365C] transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>SVG</span>
                    </button>

                    {/* Export PNG */}
                    <button
                      type="button"
                      onClick={handleExportPng}
                      disabled={!diagramSvg}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9BAFCB] hover:text-white bg-[#030E1F] border border-[#17365C] transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>

                    {/* Save to Campus Library */}
                    <button
                      type="button"
                      onClick={handleSaveDiagram}
                      disabled={isSavingDiagram || !mermaidCode.trim()}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#020B1A] bg-[#00D9FF] hover:bg-[#00D9FF]/90 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingDiagram ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Diagram</span>
                    </button>
                  </div>
                </div>

                {/* Save Success Alert */}
                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* Error Banner */}
                {renderError && (
                  <div className="p-4 bg-rose-500/10 border-b border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-rose-200">Diagram Rendering Issue</p>
                      <p className="font-mono text-[11px]">{renderError}</p>
                      <button
                        type="button"
                        onClick={() => setIsCodeEditorOpen(true)}
                        className="text-[#00D9FF] hover:underline font-semibold pt-1 block"
                      >
                        Open Editor to Fix Syntax →
                      </button>
                    </div>
                  </div>
                )}

                {/* Diagram Render Container */}
                <div className="min-h-[450px] max-h-[700px] overflow-auto p-8 flex items-center justify-center bg-[#020B1A] relative">
                  {isGeneratingVisual ? (
                    <div className="flex flex-col items-center justify-center space-y-3 text-center">
                      <Loader2 className="w-8 h-8 text-[#00D9FF] animate-spin" />
                      <p className="text-xs font-bold text-white">Synthesizing Visual from PDF...</p>
                      <p className="text-[11px] text-[#9BAFCB]">
                        Grounding concepts and relations in study notes
                      </p>
                    </div>
                  ) : diagramSvg ? (
                    <div
                      style={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: diagramSvg }}
                    />
                  ) : (
                    <div className="text-center text-xs text-[#9BAFCB] space-y-2">
                      <Network className="w-8 h-8 mx-auto text-[#17365C]" />
                      <p>No diagram rendered yet. Click "Generate Visual" above.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. SAVED DIAGRAMS LIBRARY (Preserved & Enhanced)                    */}
      {/* =================================================================== */}
      {studioMode === 'saved_library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Saved Visuals Library</h2>
              <p className="text-xs text-[#9BAFCB]">
                Your synthesized diagrams and architecture flows, tied to source documents.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStudioMode('pdf_workflow');
                setPdfStage('upload');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#00D9FF] text-[#020B1A] transition shadow-md flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>New from PDF</span>
            </button>
          </div>

          {savedDiagrams.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#061830]/60 border border-[#17365C] space-y-3">
              <Layers className="w-10 h-10 mx-auto text-[#17365C]" />
              <h3 className="text-sm font-bold text-white">No Saved Visuals Found</h3>
              <p className="text-xs text-[#9BAFCB] max-w-sm mx-auto">
                Upload a lecture PDF or choose a template to synthesize and save your first visual diagram.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStudioMode('pdf_workflow');
                  setPdfStage('upload');
                }}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-[#020B1A] bg-[#00D9FF] transition"
              >
                Upload PDF Notes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDiagrams.map((diag) => (
                <div
                  key={diag.id}
                  onClick={() => handleOpenSavedDiagram(diag)}
                  className="rounded-2xl bg-[#061830]/80 border border-[#17365C] hover:border-[#00D9FF]/50 transition p-5 space-y-3 cursor-pointer group shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                        {diag.diagram_type}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedDiagram(diag.id, e)}
                        className="text-[#9BAFCB] hover:text-rose-400 p-1 transition"
                        title="Delete diagram"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-[#00D9FF] transition line-clamp-1">
                      {diag.title}
                    </h4>

                    {diag.topic && (
                      <p className="text-xs text-[#9BAFCB] font-medium line-clamp-1">
                        Topic: {diag.topic}
                      </p>
                    )}

                    {diag.description && (
                      <p className="text-[11px] text-[#9BAFCB]/70 line-clamp-2">
                        {diag.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#17365C]/60 flex items-center justify-between text-[11px] text-[#9BAFCB]">
                    <span>{new Date(diag.created_at || Date.now()).toLocaleDateString()}</span>
                    <span className="text-[#00D9FF] font-semibold group-hover:underline">
                      Open Visual →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. ARCHITECTURE TEMPLATES LIBRARY                                  */}
      {/* =================================================================== */}
      {studioMode === 'templates' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Reference Architecture Templates</h2>
            <p className="text-xs text-[#9BAFCB]">
              Standard computer science and systems architecture diagrams for rapid study.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARCHITECTURE_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl)}
                className="rounded-2xl bg-[#061830]/80 border border-[#17365C] hover:border-[#00D9FF]/50 transition p-5 space-y-3 cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                      {tmpl.type}
                    </span>
                    <span className="text-xs text-[#9BAFCB]">{tmpl.subject}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-[#00D9FF] transition">
                    {tmpl.name}
                  </h4>

                  <p className="text-xs text-[#9BAFCB] line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#17365C]/60 flex items-center justify-between text-xs text-[#00D9FF] font-semibold">
                  <span>Explore Template</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. CODE EDITOR MODAL                                                */}
      {/* =================================================================== */}
      {isCodeEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-[#030E1F] border border-[#17365C] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#17365C] pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#00D9FF]" />
                <h3 className="text-sm font-bold text-white">Edit Mermaid Diagram Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeEditorOpen(false)}
                className="text-[#9BAFCB] hover:text-white text-xs px-2 py-1"
              >
                ✕ Cancel
              </button>
            </div>

            <textarea
              rows={14}
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#020B1A] border border-[#17365C] text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#00D9FF] selection:bg-[#00D9FF]/30"
              placeholder="Mermaid.js source code..."
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#9BAFCB]">
                Mermaid syntax will be sanitized and validated upon applying.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCodeEditorOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#9BAFCB] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCodeEdit}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#020B1A] bg-[#00D9FF] hover:bg-[#00D9FF]/90 transition"
                >
                  Apply & Render
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
