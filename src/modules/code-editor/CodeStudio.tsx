import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code2,
  Play,
  Save,
  Trash2,
  FolderOpen,
  RotateCcw,
  Download,
  Copy,
  Check,
  Terminal,
  Plus,
  Loader2,
  AlertCircle,
  Eye,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { CodeSnippet } from '../../types';

type SupportedLanguage = 'javascript' | 'html' | 'css' | 'c';

interface SampleProgram {
  title: string;
  language: SupportedLanguage;
  code: string;
  description: string;
}

const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `// JavaScript Algorithm Sandbox
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const numbers = [10, 24, 35, 48, 59, 67, 82, 95];
console.log("Sorted Array:", numbers);
console.log("Found 48 at index:", binarySearch(numbers, 48));
console.log("Searching for 99 (not in array):", binarySearch(numbers, 99));
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background: #020B1A;
      color: #F4F7FF;
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #071B35;
      border: 1px solid #00D9FF;
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 0 30px rgba(0, 217, 255, 0.2);
      max-width: 320px;
    }
    h2 { color: #00D9FF; margin-top: 0; }
    p { color: #9BAFCB; font-size: 14px; line-height: 1.5; }
    button {
      background: linear-gradient(135deg, #087BFF, #00D9FF);
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>SANKALP Ecosystem</h2>
    <p>Real-time campus platform for university students.</p>
    <button onclick="alert('Hello from SANKALP Sandbox!')">Click Me</button>
  </div>
</body>
</html>
`,
  css: `/* Campus Card Styling */
body {
  background-color: #020B1A;
  color: #F4F7FF;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.campus-box {
  background: #071B35;
  border: 1px solid #17365C;
  border-top: 3px solid #00D9FF;
  padding: 24px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.campus-box h3 {
  color: #00D9FF;
  margin: 0 0 10px 0;
}

.campus-box p {
  color: #9BAFCB;
  font-size: 13px;
  line-height: 1.6;
}

.badge {
  display: inline-block;
  background: rgba(0, 217, 255, 0.15);
  color: #00D9FF;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-family: monospace;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>

// Dynamic Memory Allocation & Fibonacci in C
int main() {
    int n = 10;
    int *fib = (int *)malloc(n * sizeof(int));
    
    if (fib == NULL) {
        printf("Memory allocation failed!\\n");
        return 1;
    }

    fib[0] = 0;
    fib[1] = 1;

    printf("=== SANKALP C Sandbox ===\\n");
    printf("Computing first %d Fibonacci numbers:\\n", n);
    printf("Fib[0] = %d\\n", fib[0]);
    printf("Fib[1] = %d\\n", fib[1]);

    for (int i = 2; i < n; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
        printf("Fib[%d] = %d\\n", i, fib[i]);
    }

    free(fib);
    printf("Memory freed successfully.\\n");
    return 0;
}
`,
};

const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    title: 'Binary Search Algorithm',
    language: 'javascript',
    description: 'Logarithmic search O(log N) in sorted arrays',
    code: STARTER_TEMPLATES.javascript,
  },
  {
    title: 'Interactive Student Card',
    language: 'html',
    description: 'Sandboxed HTML5 component with inline styles',
    code: STARTER_TEMPLATES.html,
  },
  {
    title: 'Midnight Cyan Card Styles',
    language: 'css',
    description: 'Pure CSS styling for university cards',
    code: STARTER_TEMPLATES.css,
  },
  {
    title: 'Dynamic Array Allocation in C',
    language: 'c',
    description: 'Dynamic memory malloc/free and Fibonacci series',
    code: STARTER_TEMPLATES.c,
  },
];

export const CodeStudio: React.FC = () => {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [activeSnippet, setActiveSnippet] = useState<CodeSnippet | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [title, setTitle] = useState('Binary Search Algorithm');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState(STARTER_TEMPLATES.javascript);

  // Execution & Output panel
  const [output, setOutput] = useState<string>('Ready to execute code. Click "Run Code" above.');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadSnippets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getCodeSnippets(user.id);
      setSnippets(data || []);
    } catch (err) {
      console.error('Error fetching code snippets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnippets();
  }, [user]);

  const selectSnippet = (s: CodeSnippet) => {
    setActiveSnippet(s);
    setTitle(s.title);
    const lang = (s.language as SupportedLanguage) || 'javascript';
    setLanguage(['javascript', 'html', 'css', 'c'].includes(lang) ? lang : 'javascript');
    setCode(s.code);
    setOutput(s.output || 'Snippet loaded. Click "Run Code" to execute.');
    if (lang === 'html' || lang === 'css') {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  };

  const handleNewSnippet = () => {
    setActiveSnippet(null);
    setTitle('Untitled ' + language.toUpperCase() + ' Code');
    setCode(STARTER_TEMPLATES[language]);
    setOutput('New file created. Ready to write code.');
    if (language === 'html' || language === 'css') {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    if (!activeSnippet) {
      setCode(STARTER_TEMPLATES[newLang]);
      setTitle('Untitled ' + newLang.toUpperCase() + ' Code');
    }
    if (newLang === 'html' || newLang === 'css') {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  };

  // Run Code according to language
  const handleRunCode = async () => {
    setIsRunning(true);
    setStatusMsg(null);

    // 1. JAVASCRIPT: Client sandbox execution
    if (language === 'javascript') {
      setActiveTab('console');
      setOutput('Executing in isolated Web Worker sandbox...\n');
      try {
        const workerScript = `
          const logs = [];
          const customConsole = {
            log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
            error: (...args) => logs.push('[Error]: ' + args.join(' ')),
            warn: (...args) => logs.push('[Warning]: ' + args.join(' ')),
            info: (...args) => logs.push('[Info]: ' + args.join(' '))
          };
          self.onmessage = function(e) {
            try {
              const runFn = new Function('console', e.data);
              const t0 = performance.now();
              runFn(customConsole);
              const elapsed = (performance.now() - t0).toFixed(2);
              self.postMessage({ success: true, logs, elapsed });
            } catch (err) {
              self.postMessage({ success: false, error: err.stack || err.message });
            }
          };
        `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        let finished = false;
        const timeoutId = setTimeout(() => {
          if (!finished) {
            finished = true;
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            setOutput('[Execution Timed Out]: Program exceeded maximum execution limit of 3000ms (potential infinite loop).');
            setIsRunning(false);
          }
        }, 3000);

        worker.onmessage = (event) => {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          const { success, logs, elapsed, error } = event.data;
          if (success) {
            const resultOutput =
              logs.length > 0
                ? `${logs.join('\n')}\n\n[Process completed successfully in ${elapsed}ms]`
                : `[Execution finished in ${elapsed}ms with no console output]`;
            setOutput(resultOutput);
          } else {
            setOutput(`[Runtime Error]:\n${error}`);
          }
          setIsRunning(false);
        };

        worker.onerror = (err) => {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          setOutput(`[Execution Error]: ${err.message}`);
          setIsRunning(false);
        };

        worker.postMessage(code);
      } catch (err: any) {
        setOutput(`[Sandbox Error]: ${err.message}`);
        setIsRunning(false);
      }
      return;
    }

    // 2. HTML: Sandboxed iframe preview
    if (language === 'html') {
      setActiveTab('preview');
      setOutput('HTML document rendered in isolated preview frame.');
      setIsRunning(false);
      return;
    }

    // 3. CSS: Live preview in wrapper frame
    if (language === 'css') {
      setActiveTab('preview');
      setOutput('CSS styles rendered live against campus container.');
      setIsRunning(false);
      return;
    }

    // 4. C: Isolated runner execution (Piston API with graceful fallback notice)
    if (language === 'c') {
      setActiveTab('console');
      setOutput('Sending C program to isolated sandbox compilation runner...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'c',
            version: '10.2.0',
            files: [{ name: 'main.c', content: code }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Runner service HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.run) {
          const runOutput = data.run.output || (data.run.stderr ? `Error:\n${data.run.stderr}` : 'Program exited with status 0.');
          setOutput(runOutput);
        } else if (data.compile && data.compile.stderr) {
          setOutput(`[Compilation Error]:\n${data.compile.stderr}`);
        } else {
          setOutput('C program execution completed.');
        }
      } catch (err: any) {
        setOutput(
          `[Notice]: Online C execution is currently unavailable (${err.message}).\n` +
            `Your program code has been preserved and can be saved to your SANKALP workspace.`
        );
      } finally {
        setIsRunning(false);
      }
    }
  };

  // Clear Output Terminal
  const handleClearOutput = () => {
    setOutput('Output cleared. Ready for next execution.');
  };

  // Download Code File
  const handleDownloadCode = () => {
    const extMap: Record<SupportedLanguage, string> = {
      javascript: 'js',
      html: 'html',
      css: 'css',
      c: 'c',
    };
    const extension = extMap[language] || 'txt';
    const filename = `${(title || 'code').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.${extension}`;

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save Code to Database
  const handleSaveSnippet = async () => {
    if (!user) {
      setStatusMsg('Please sign in to save your code.');
      return;
    }
    if (!title.trim() || !code.trim()) {
      setStatusMsg('Please provide a title and code before saving.');
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    try {
      const saved = await apiService.saveCodeSnippet(user.id, {
        id: activeSnippet?.id,
        title: title.trim(),
        language,
        code,
        output,
        tags: [language.toUpperCase()],
      });

      if (saved) {
        setActiveSnippet(saved);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        await loadSnippets();
      }
    } catch (err: any) {
      console.error('Error saving code snippet:', err);
      setStatusMsg(err?.message || 'Failed to save code.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Code Snippet
  const handleDeleteSnippet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved code file?')) return;
    try {
      await apiService.deleteCodeSnippet(id);
      if (activeSnippet?.id === id) {
        handleNewSnippet();
      }
      await loadSnippets();
    } catch (err) {
      console.error('Error deleting snippet:', err);
    }
  };

  // Build live preview document for HTML/CSS
  const previewHtml = language === 'html'
    ? code
    : language === 'css'
    ? `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="campus-box"><span class="badge">CSS PREVIEW</span><h3>Live Styles Test</h3><p>This container is rendered live using your CSS rules above.</p></div></body></html>`
    : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#087BFF]/15 text-[#00D9FF] border border-[#087BFF]/30 shadow-[0_0_20px_rgba(8,123,255,0.15)]">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
              Code Editor
            </h1>
            <p className="text-xs text-[#9BAFCB]">
              Multi-language programming environment for HTML, CSS, C, and JavaScript.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleNewSnippet}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#071B35] border border-[#17365C] text-[#F4F7FF] hover:border-[#00D9FF]/40 hover:text-[#00D9FF] transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>New Code</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCode}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#071B35] border border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF] hover:border-[#17365C]/80 transition flex items-center gap-1.5"
            title="Download Code File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSnippet}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#071B35] border border-[#17365C] text-[#F4F7FF] hover:border-[#00D9FF]/40 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D9FF]" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#00D9FF]" />
            )}
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#087BFF] to-[#00D9FF] hover:opacity-95 text-white shadow-lg shadow-[#087BFF]/25 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Studio Grid: Sidebar + Monaco Editor & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Saved Codes & Curated Programs */}
        <div className="lg:col-span-4 space-y-4">
          {/* Saved Codes List */}
          <div className="p-4 rounded-2xl bg-[#071B35] border border-[#17365C] space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F4F7FF] font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>Saved Codes ({snippets.length})</span>
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {snippets.length === 0 ? (
                <div className="py-6 text-center text-[#9BAFCB] text-xs">
                  <FileCode className="w-6 h-6 mx-auto text-[#17365C] mb-1.5" />
                  No saved code yet. Click &quot;Save Code&quot; to preserve your work.
                </div>
              ) : (
                snippets.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => selectSnippet(s)}
                    className={`p-3 rounded-xl cursor-pointer transition border text-left flex items-start justify-between ${
                      activeSnippet?.id === s.id
                        ? 'bg-[#087BFF]/15 border-[#00D9FF]/40 text-[#F4F7FF] shadow-sm'
                        : 'bg-[#030E1F] border-[#17365C] text-[#9BAFCB] hover:text-[#F4F7FF] hover:border-[#17365C]/80'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold truncate text-[#F4F7FF]">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#061830] text-[#00D9FF] border border-[#17365C]">
                          {s.language}
                        </span>
                        <span className="text-[10px] text-[#9BAFCB]">
                          {new Date(s.updated_at || s.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSnippet(s.id, e)}
                      className="p-1 rounded text-[#9BAFCB] hover:text-rose-400 hover:bg-[#061830] transition"
                      title="Delete Code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Curated Sample Programs */}
          <div className="p-4 rounded-2xl bg-[#071B35] border border-[#17365C] space-y-2.5 shadow-xl">
            <span className="text-xs font-bold text-[#F4F7FF] font-mono uppercase tracking-wider block">
              Sample Programs
            </span>
            <div className="space-y-1.5">
              {SAMPLE_PROGRAMS.map((sp) => (
                <button
                  key={sp.title}
                  type="button"
                  onClick={() => {
                    setActiveSnippet(null);
                    setTitle(sp.title);
                    setLanguage(sp.language);
                    setCode(sp.code);
                    setOutput(`Loaded ${sp.title}. Press "Run Code" to execute.`);
                    if (sp.language === 'html' || sp.language === 'css') {
                      setActiveTab('preview');
                    } else {
                      setActiveTab('console');
                    }
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-[#030E1F] hover:bg-[#081F3D]/60 border border-[#17365C] hover:border-[#00D9FF]/30 text-xs text-[#9BAFCB] hover:text-[#00D9FF] transition"
                >
                  <p className="font-semibold text-[#F4F7FF] truncate">{sp.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono uppercase text-[#00D9FF]">
                      {sp.language}
                    </span>
                    <span className="text-[10px] text-[#9BAFCB] truncate max-w-[140px]">
                      {sp.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Terminal */}
        <div className="lg:col-span-8 space-y-4">
          {/* Metadata Controls Bar */}
          <div className="p-3.5 rounded-2xl bg-[#071B35] border border-[#17365C] flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="File Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-semibold text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#9BAFCB] font-mono font-medium">Language:</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="px-3 py-1.5 rounded-xl bg-[#061830] border border-[#17365C] text-xs font-mono uppercase text-[#00D9FF] focus:outline-none focus:border-[#00D9FF] cursor-pointer"
              >
                <option value="javascript">JavaScript (.js)</option>
                <option value="html">HTML (.html)</option>
                <option value="css">CSS (.css)</option>
                <option value="c">C (.c)</option>
              </select>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="rounded-2xl overflow-hidden border border-[#17365C] shadow-2xl bg-[#020B1A]">
            {/* Editor Chrome Top Bar */}
            <div className="px-4 py-2 bg-[#061329] border-b border-[#17365C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-mono text-[#9BAFCB]">
                  {title || 'untitled'}.{language === 'javascript' ? 'js' : language}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-[#9BAFCB]/70">
                <span>UTF-8</span>
                <span>Spaces: 2</span>
              </div>
            </div>

            <Editor
              height="380px"
              language={language === 'c' ? 'c' : language}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Output Terminal & Live Preview Tab */}
          <div className="p-4 rounded-2xl bg-[#071B35] border border-[#17365C] space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#17365C]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-xs font-mono font-bold text-[#F4F7FF] uppercase tracking-wider">
                  Program Output & Terminal
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(language === 'html' || language === 'css') && (
                  <div className="flex rounded-lg bg-[#030E1F] p-0.5 border border-[#17365C] text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('console')}
                      className={`px-3 py-1 rounded-md transition ${
                        activeTab === 'console'
                          ? 'bg-[#087BFF]/30 text-[#00D9FF] font-medium'
                          : 'text-[#9BAFCB]'
                      }`}
                    >
                      Console Log
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded-md transition ${
                        activeTab === 'preview'
                          ? 'bg-[#087BFF]/30 text-[#00D9FF] font-medium'
                          : 'text-[#9BAFCB]'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleClearOutput}
                  className="text-[11px] font-mono text-[#9BAFCB] hover:text-[#F4F7FF] px-2 py-1 rounded bg-[#030E1F] border border-[#17365C] transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {(language === 'html' || language === 'css') && activeTab === 'preview' ? (
              <div className="w-full h-56 rounded-xl overflow-hidden bg-white border border-[#17365C] shadow-inner">
                <iframe
                  title="Live Preview Sandbox"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts"
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <pre className="p-3.5 rounded-xl bg-[#020B1A] border border-[#17365C] font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto min-h-[100px] max-h-52 whitespace-pre-wrap select-text">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
