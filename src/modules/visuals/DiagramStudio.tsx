import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import {
  GitGraph,
  Save,
  Download,
  Trash2,
  Plus,
  Play,
  Copy,
  Check,
  AlertCircle,
  FileCode,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Diagram, DiagramType } from '../../types';

// Preset Templates
const DIAGRAM_TEMPLATES: { name: string; type: DiagramType; code: string; desc: string }[] = [
  {
    name: 'Microservice Authentication Flow',
    type: 'flowchart',
    desc: 'OAuth2 JWT token exchange with API Gateway and Database RLS',
    code: `flowchart TD
    Client[Web / Mobile Client] -->|1. Credentials| Gateway[API Gateway]
    Gateway -->|2. Verify| Auth[Supabase Auth]
    Auth -->|3. Signed JWT| Client
    Client -->|4. Bearer Token| Gateway
    Gateway -->|5. Service Request| Microservice[Campus Services]
    Microservice -->|6. RLS Query (auth.uid)| DB[(PostgreSQL + RLS)]
    DB -->|7. Isolated Student Data| Microservice
    Microservice -->|8. Secure Response| Client`,
  },
  {
    name: 'Operating System Process Lifecycle',
    type: 'stateDiagram',
    desc: 'States from process creation to scheduler dispatch and exit',
    code: `stateDiagram-v2
    [*] --> New: fork() / create
    New --> Ready: Admitted
    Ready --> Running: CPU Dispatch
    Running --> Ready: Preemption / Timer
    Running --> Blocked: I/O or Event Wait
    Blocked --> Ready: I/O Complete
    Running --> Terminated: exit()
    Terminated --> [*]`,
  },
  {
    name: 'TCP 3-Way Handshake',
    type: 'sequence',
    desc: 'Synchronize and Acknowledge sequence numbers between Client and Host',
    code: `sequenceDiagram
    autonumber
    actor Client as Client Host
    actor Server as Campus Server
    Client->>Server: SYN (Seq=X)
    Note over Server: Allocate buffer & socket
    Server->>Client: SYN-ACK (Seq=Y, Ack=X+1)
    Note over Client: Allocate TCP control block
    Client->>Server: ACK (Seq=X+1, Ack=Y+1)
    Note over Client,Server: Connection ESTABLISHED`,
  },
  {
    name: 'University Academic Domain Model',
    type: 'classDiagram',
    desc: 'Object-oriented relations between Students, Courses, and Attendance',
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

export const DiagramStudio: React.FC = () => {
  const { user } = useAuth();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [activeDiagram, setActiveDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('New Concept Architecture');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Distributed Systems');
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [mermaidCode, setMermaidCode] = useState(DIAGRAM_TEMPLATES[0].code);
  const [description, setDescription] = useState(DIAGRAM_TEMPLATES[0].desc);

  // Rendering & Zoom
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize Mermaid with Dark/Cyber theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#070b14',
        primaryColor: '#0e7490',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#38bdf8',
        secondaryColor: '#6d28d9',
        tertiaryColor: '#0f172a',
      },
      securityLevel: 'loose',
    });
  }, []);

  const loadSavedDiagrams = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await apiService.getDiagrams(user.id);
      setDiagrams(list);
      if (list.length > 0 && !activeDiagram) {
        selectDiagram(list[0]);
      }
    } catch (err) {
      console.error('Error fetching diagrams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedDiagrams();
  }, [user]);

  // Live render whenever mermaidCode changes
  useEffect(() => {
    let isCancelled = false;

    async function renderMermaid() {
      if (!containerRef.current) return;
      try {
        setRenderError(null);
        const uniqueId = `mermaid_svg_${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, mermaidCode);
        if (!isCancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err: any) {
        if (!isCancelled) {
          setRenderError(err.message || 'Syntax error in Mermaid syntax');
        }
      }
    }

    const timer = setTimeout(renderMermaid, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [mermaidCode]);

  const selectDiagram = (diag: Diagram) => {
    setActiveDiagram(diag);
    setTitle(diag.title);
    setSubject(diag.subject);
    setTopic(diag.topic || '');
    setDiagramType(diag.diagram_type);
    setMermaidCode(diag.mermaid_code);
    setDescription(diag.description || '');
  };

  const handleNewDiagram = () => {
    setActiveDiagram(null);
    setTitle('New Architecture Diagram');
    setSubject('General');
    setTopic('');
    setDiagramType('flowchart');
    setMermaidCode(DIAGRAM_TEMPLATES[0].code);
    setDescription('');
  };

  const handleSaveDiagram = async () => {
    if (!user || !title.trim() || !mermaidCode.trim()) return;
    try {
      const saved = await apiService.saveDiagram(user.id, {
        id: activeDiagram?.id,
        title: title.trim(),
        subject,
        topic,
        diagram_type: diagramType,
        mermaid_code: mermaidCode,
        description,
      });
      setActiveDiagram(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Error saving diagram:', err);
    }
  };

  const handleDeleteDiagram = async (id: string) => {
    if (!window.confirm('Delete this saved diagram?')) return;
    try {
      await apiService.deleteDiagram(id);
      if (activeDiagram?.id === id) {
        handleNewDiagram();
      }
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Error deleting diagram:', err);
    }
  };

  // Export diagram as SVG file
  const handleExportSvg = () => {
    if (!containerRef.current) return;
    const svgElem = containerRef.current.querySelector('svg');
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <GitGraph className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Notes, Visuals & Concept Diagram Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Author engineering flowcharts, architecture maps, and state machines with live Mermaid rendering and instant SVG exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewDiagram}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl glass-panel text-slate-200 hover:text-cyan-300 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Diagram</span>
          </button>
          <button
            onClick={handleExportSvg}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export SVG</span>
          </button>
          <button
            onClick={handleSaveDiagram}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white shadow-glow-cyan transition flex items-center gap-1.5"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Diagram'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Saved Library & Templates */}
        <div className="lg:col-span-4 space-y-4">
          {/* Saved Diagrams */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                Saved Diagrams ({diagrams.length})
              </span>
              <FileCode className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {diagrams.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No saved diagrams. Create your first visual below.
                </div>
              ) : (
                diagrams.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => selectDiagram(d)}
                    className={`p-2.5 rounded-xl cursor-pointer transition border text-left flex items-start justify-between ${
                      activeDiagram?.id === d.id
                        ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-glow-blue'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold truncate text-slate-100">{d.title}</p>
                      <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-300">
                        {d.subject} • {d.diagram_type}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDiagram(d.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preset Templates */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              Engineering Templates
            </span>
            <div className="space-y-1.5">
              {DIAGRAM_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => {
                    setActiveDiagram(null);
                    setTitle(tmpl.name);
                    setDiagramType(tmpl.type);
                    setMermaidCode(tmpl.code);
                    setDescription(tmpl.desc);
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 transition"
                >
                  <p className="font-semibold">{tmpl.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Diagram Metadata */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Diagram Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Type</label>
                <select
                  value={diagramType}
                  onChange={(e) => setDiagramType(e.target.value as DiagramType)}
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                >
                  <option value="flowchart" className="bg-slate-900 text-white">Flowchart</option>
                  <option value="sequence" className="bg-slate-900 text-white">Sequence</option>
                  <option value="stateDiagram" className="bg-slate-900 text-white">State Diagram</option>
                  <option value="classDiagram" className="bg-slate-900 text-white">Class Diagram</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Description / Key Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief notes about this diagram..."
                className="w-full px-3 py-1.5 rounded-xl glass-input text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Live Visual Rendering */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mermaid Code Editor */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                <span>Mermaid Source Code</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Live reactive re-render
              </span>
            </div>
            <textarea
              rows={8}
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
              className="w-full p-3 rounded-xl glass-input text-xs font-mono leading-relaxed resize-y bg-[#060a14]"
              spellCheck={false}
            />
          </div>

          {/* Live Diagram Canvas Viewport */}
          <div className="p-5 rounded-2xl glass-panel border border-cyan-500/25 relative overflow-hidden shadow-2xl min-h-[380px] flex flex-col justify-between">
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-100">{title}</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.1))}
                  className="p-1 rounded text-slate-400 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-cyan-400 px-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((s) => Math.min(2.5, s + 0.1))}
                  className="p-1 rounded text-slate-400 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="p-1 rounded text-slate-400 hover:text-white transition ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error Overlay */}
            {renderError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs my-auto flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Mermaid Syntax Parsing Error</p>
                  <p className="text-[11px] font-mono text-rose-400/90 mt-1">{renderError}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 w-full overflow-auto flex items-center justify-center p-6 min-h-[300px]">
                <div
                  ref={containerRef}
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
                  className="transition-transform duration-200 max-w-full"
                />
              </div>
            )}

            {/* Diagram Footer Description */}
            {description && (
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Notes: </span>
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
