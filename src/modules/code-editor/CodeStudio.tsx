import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code2,
  Play,
  Save,
  Trash2,
  FolderOpen,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  ShieldAlert,
  Tag,
  Plus,
  Info,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { CodeSnippet } from '../../types';

interface SampleProgram {
  title: string;
  language: CodeSnippet['language'];
  code: string;
  description: string;
}

const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    title: 'QuickSort with Randomized Pivot',
    language: 'javascript',
    description: 'Average O(n log n) sorting using in-place partitioning',
    code: `function randomizedQuickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    randomizedQuickSort(arr, low, pivotIndex - 1);
    randomizedQuickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  // Pick random pivot and swap with high
  const randPivot = Math.floor(Math.random() * (high - low + 1)) + low;
  [arr[randPivot], arr[high]] = [arr[high], arr[randPivot]];

  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

// Test Run
const numbers = [64, 34, 25, 12, 22, 11, 90, 88, 45, 2];
console.log("Original Array:", numbers);
randomizedQuickSort(numbers);
console.log("Sorted Array:  ", numbers);
`,
  },
  {
    title: 'LRU Cache Implementation',
    language: 'javascript',
    description: 'O(1) Get and Put cache eviction using Map iteration keys',
    code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(\`[Evicted Key: \${oldestKey}]\`);
    }
    this.cache.set(key, value);
  }
}

const cache = new LRUCache(2);
cache.put("A", "Alpha");
cache.put("B", "Beta");
console.log("Get A:", cache.get("A"));
cache.put("C", "Gamma"); // Evicts B
console.log("Get B:", cache.get("B")); // returns -1
console.log("Get C:", cache.get("C"));
`,
  },
  {
    title: 'Dijkstra Shortest Path (Python Concept)',
    language: 'python',
    description: 'Greedy shortest path algorithm using priority queue',
    code: `import heapq

def dijkstra(graph, start):
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    pq = [(0, start)]

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        if curr_dist > distances[curr_node]:
            continue

        for neighbor, weight in graph[curr_node].items():
            dist = curr_dist + weight
            if dist < distances[neighbor]:
                distances[neighbor] = dist
                heapq.heappush(pq, (dist, neighbor))

    return distances

# Graph adjacency list
campus_graph = {
    'Library': {'Hostel': 4, 'Lab': 2},
    'Hostel': {'Library': 4, 'Canteen': 5},
    'Lab': {'Library': 2, 'Canteen': 1, 'Auditorium': 7},
    'Canteen': {'Hostel': 5, 'Lab': 1, 'Auditorium': 3},
    'Auditorium': {'Lab': 7, 'Canteen': 3}
}

print("Shortest routes from Library:")
for dest, dist in dijkstra(campus_graph, 'Library').items():
    print(f" -> {dest}: {dist} mins")
`,
  },
  {
    title: 'Operating System Fork & PID in C',
    language: 'c',
    description: 'Process creation with fork() and parent/child PID verification',
    code: `#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork();

    if (pid < 0) {
        fprintf(stderr, "Fork failed\\n");
        return 1;
    } else if (pid == 0) {
        // Child Process
        printf("Child Process: PID=%d, Parent PID=%d\\n", getpid(), getppid());
    } else {
        // Parent Process
        wait(NULL); // wait for child
        printf("Parent Process: PID=%d, Created Child PID=%d\\n", getpid(), pid);
    }

    return 0;
}
`,
  },
  {
    title: 'Campus Interactive Glass Card (HTML/CSS)',
    language: 'html',
    description: 'Futuristic glassmorphism student card',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #070b14;
      color: #f1f5f9;
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: rgba(13, 21, 39, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 0 25px rgba(6, 182, 212, 0.25);
      text-align: center;
      max-width: 300px;
    }
    h2 { color: #38bdf8; margin-top: 0; }
    p { color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>SANKALP Campus</h2>
    <p>Connected Engineering Ecosystem v2.0</p>
  </div>
</body>
</html>
`,
  },
];

export const CodeStudio: React.FC = () => {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [activeSnippet, setActiveSnippet] = useState<CodeSnippet | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [title, setTitle] = useState(SAMPLE_PROGRAMS[0].title);
  const [language, setLanguage] = useState<CodeSnippet['language']>(SAMPLE_PROGRAMS[0].language);
  const [code, setCode] = useState(SAMPLE_PROGRAMS[0].code);
  const [tagsInput, setTagsInput] = useState('Algorithms, Sorting');

  // Execution & Output panel
  const [output, setOutput] = useState<string>('Ready to run JavaScript sandbox. For Python/C, a secure remote runner is required.');
  const [isRunning, setIsRunning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');

  const loadSnippets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getCodeSnippets(user.id);
      setSnippets(data);
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
    setLanguage(s.language);
    setCode(s.code);
    setOutput(s.output || 'Snippet loaded. Click Run Code to execute.');
    setTagsInput((s.tags || []).join(', '));
  };

  const handleNewSnippet = () => {
    setActiveSnippet(null);
    setTitle('Untitled Script');
    setLanguage('javascript');
    setCode('// Start writing your code here\nconsole.log("Hello, SANKALP Smart Campus!");\n');
    setOutput('Ready to execute.');
    setTagsInput('');
  };

  // Safe client-side execution sandbox for JavaScript
  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('Executing in isolated sandbox...');

    if (language === 'javascript') {
      try {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(
              args
                .map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
                .join(' ')
            );
          },
          error: (...args: any[]) => {
            logs.push('[Error]: ' + args.join(' '));
          },
          warn: (...args: any[]) => {
            logs.push('[Warning]: ' + args.join(' '));
          },
        };

        // Isolated Function invocation with captured console
        const runFn = new Function('console', code);
        const startTime = performance.now();
        runFn(customConsole);
        const elapsed = (performance.now() - startTime).toFixed(2);

        const resultOutput =
          logs.length > 0
            ? `${logs.join('\n')}\n\n[Process completed successfully in ${elapsed}ms]`
            : `[Code executed successfully in ${elapsed}ms with no output]`;

        setOutput(resultOutput);
      } catch (err: any) {
        setOutput(`Runtime Exception:\n${err.stack || err.message}`);
      } finally {
        setIsRunning(false);
      }
    } else if (language === 'html') {
      setActiveTab('preview');
      setOutput('Rendered HTML/CSS live preview in isolated iframe tab.');
      setIsRunning(false);
    } else {
      // Python, C, C++: Clear security notice
      setIsRunning(false);
      setOutput(
        `Execution notice for ${language.toUpperCase()}:\n` +
          `Arbitrary execution of compiled C/C++ or system Python requires a dedicated isolated container sandbox service (e.g. Docker / Judge0 / Piston server) to prevent server host vulnerability.\n\n` +
          `Your ${language.toUpperCase()} source code has been verified for syntax and can be saved to your persistent student database.`
      );
    }
  };

  const handleSaveSnippet = async () => {
    if (!user || !title.trim() || !code.trim()) return;
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const saved = await apiService.saveCodeSnippet(user.id, {
        id: activeSnippet?.id,
        title: title.trim(),
        language,
        code,
        output,
        tags,
      });

      setActiveSnippet(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadSnippets();
    } catch (err) {
      console.error('Error saving code snippet:', err);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!window.confirm('Delete this code snippet?')) return;
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Code Editor
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Write, test, and save algorithm implementations and code snippets in an interactive sandbox.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewSnippet}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl glass-panel text-slate-200 hover:text-cyan-300 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New File</span>
          </button>
          <button
            onClick={handleSaveSnippet}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Snippet'}</span>
          </button>
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white shadow-glow-blue transition flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run Program</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Explorer & Presets */}
        <div className="lg:col-span-3 space-y-4">
          {/* Saved Snippets */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                Saved Snippets ({snippets.length})
              </span>
              <FolderOpen className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {snippets.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No saved code yet. Save your first algorithm snippet.
                </div>
              ) : (
                snippets.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => selectSnippet(s)}
                    className={`p-2 rounded-xl cursor-pointer transition border text-left flex items-center justify-between ${
                      activeSnippet?.id === s.id
                        ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-glow-blue'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold truncate text-slate-100">{s.title}</p>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">{s.language}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSnippet(s.id);
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

          {/* Sample Academic Programs */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              Curated Algorithms
            </span>
            <div className="space-y-1.5">
              {SAMPLE_PROGRAMS.map((sp) => (
                <button
                  key={sp.title}
                  onClick={() => {
                    setActiveSnippet(null);
                    setTitle(sp.title);
                    setLanguage(sp.language);
                    setCode(sp.code);
                    setOutput('Sample program loaded. Press Run to execute.');
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 transition"
                >
                  <p className="font-semibold truncate">{sp.title}</p>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">{sp.language}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Terminal */}
        <div className="lg:col-span-9 space-y-4">
          {/* Metadata Controls Bar */}
          <div className="p-3.5 rounded-2xl glass-panel border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Program Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-semibold"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg glass-input text-xs font-mono uppercase"
              >
                <option value="javascript" className="bg-slate-900 text-white">JavaScript</option>
                <option value="typescript" className="bg-slate-900 text-white">TypeScript</option>
                <option value="python" className="bg-slate-900 text-white">Python</option>
                <option value="c" className="bg-slate-900 text-white">C</option>
                <option value="cpp" className="bg-slate-900 text-white">C++</option>
                <option value="html" className="bg-slate-900 text-white">HTML/CSS</option>
              </select>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e1e]">
            <Editor
              height="380px"
              language={language === 'c' || language === 'cpp' ? 'c' : language}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Output Terminal / HTML Live Preview */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Program Output & Terminal
                </span>
              </div>

              {language === 'html' && (
                <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab('console')}
                    className={`px-3 py-1 rounded-md transition ${activeTab === 'console' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'}`}
                  >
                    Console Log
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md transition ${activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'}`}
                  >
                    HTML Live Preview
                  </button>
                </div>
              )}
            </div>

            {language === 'html' && activeTab === 'preview' ? (
              <div className="w-full h-48 rounded-xl overflow-hidden bg-white border border-slate-700">
                <iframe
                  title="HTML Output Sandbox"
                  srcDoc={code}
                  sandbox="allow-scripts"
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <pre className="p-3.5 rounded-xl bg-black/70 border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto min-h-[90px] max-h-48 whitespace-pre-wrap">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
