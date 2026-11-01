// ==============================================================================
// SANKALP — PDF-Based Topic Extraction & Visuals Service
// ==============================================================================

import { ExtractedTopic, DiagramType, PdfExtractionResult } from '../types';
import { apiService } from './apiService';
import { sanitizeMermaid } from '../utils/mermaidSanitizer';

// Enforce max PDF file size (10 MB)
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

export const validatePdfUpload = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'Please choose a PDF file to upload.' };
  }
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return { valid: false, error: 'Invalid file format. Only PDF files (.pdf) are supported.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The selected PDF file is empty (0 bytes).' };
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size exceeds the 10 MB limit (Current: ${sizeMb} MB).` };
  }
  return { valid: true };
};

// Client-side multi-page text extraction preserving page boundaries and order
export const extractPdfContent = async (file: File): Promise<PdfExtractionResult> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const latinText = new TextDecoder('latin1').decode(bytes);

  // Check for encrypted/password-protected PDF
  if (latinText.includes('/Encrypt')) {
    return {
      fileName: file.name,
      fileSize: file.size,
      pageCount: 0,
      pages: [],
      fullText: '',
      isEncrypted: true,
      hasContent: false,
      error: 'This PDF is password-protected or encrypted. Please upload an unprotected version.',
    };
  }

  // Count /Page objects or estimate pages
  const pageMatches = latinText.match(/\/Type\s*\/Page\b/g);
  const detectedPageCount = pageMatches ? pageMatches.length : 1;

  // Split text by page delimiters or collect streams
  const pages: Array<{ pageNumber: number; text: string; charCount: number }> = [];

  // Parse text inside BT ... ET blocks
  const btEtRegex = /BT[\s\S]*?ET/g;
  const rawBlocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = btEtRegex.exec(latinText)) !== null) {
    const block = match[0];
    const blockTextParts: string[] = [];

    // Match (string) Tj or (string)' or (string)"
    const strRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let strMatch: RegExpExecArray | null;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const clean = strMatch[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean) blockTextParts.push(clean);
    }

    // Match array strings: [ (s1) 12 (s2) ] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
      const inside = arrayMatch[1];
      const innerStrRegex = /\(([^)]+)\)/g;
      let innerMatch: RegExpExecArray | null;
      let combined = '';
      while ((innerMatch = innerStrRegex.exec(inside)) !== null) {
        combined += innerMatch[1].replace(/\\([()\\])/g, '$1');
      }
      if (combined.trim()) blockTextParts.push(combined.trim());
    }

    if (blockTextParts.length > 0) {
      rawBlocks.push(blockTextParts.join(' '));
    }
  }

  const allExtractedText = rawBlocks.join('\n\n').replace(/\r/g, '').trim();

  // If page objects were found, split blocks across pages proportionately
  if (detectedPageCount > 1 && rawBlocks.length > 1) {
    const blocksPerPage = Math.max(1, Math.ceil(rawBlocks.length / detectedPageCount));
    for (let p = 0; p < detectedPageCount; p++) {
      const pageBlocks = rawBlocks.slice(p * blocksPerPage, (p + 1) * blocksPerPage);
      const pageText = pageBlocks.join('\n').trim();
      if (pageText) {
        pages.push({
          pageNumber: p + 1,
          text: pageText,
          charCount: pageText.length,
        });
      }
    }
  }

  // If no multi-page split or 1 page
  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      text: allExtractedText,
      charCount: allExtractedText.length,
    });
  }

  const hasContent = allExtractedText.length > 25;

  return {
    fileName: file.name,
    fileSize: file.size,
    pageCount: pages.length,
    pages,
    fullText: allExtractedText,
    isEncrypted: false,
    hasContent,
    error: hasContent
      ? undefined
      : 'No readable text could be extracted from this PDF. It may be scanned or image-only without an embedded text layer.',
  };
};

// -----------------------------------------------------------------------------
// Diagram Type Recommendation Engine
// -----------------------------------------------------------------------------
export const recommendDiagramTypes = (topic: {
  title: string;
  subtopics?: string[];
  content?: string;
}): DiagramType[] => {
  const combined = `${topic.title} ${(topic.subtopics || []).join(' ')} ${topic.content || ''}`.toLowerCase();

  const recommendations: DiagramType[] = [];

  // Database / ER
  if (
    combined.includes('database') ||
    combined.includes('entity') ||
    combined.includes('schema') ||
    combined.includes('relation') ||
    combined.includes('primary key') ||
    combined.includes('foreign key') ||
    combined.includes('table') ||
    combined.includes('normalization')
  ) {
    recommendations.push('erDiagram');
  }

  // Object-oriented / Class
  if (
    combined.includes('class') ||
    combined.includes('inheritance') ||
    combined.includes('interface') ||
    combined.includes('polymorphism') ||
    combined.includes('object-oriented') ||
    combined.includes('encapsulation')
  ) {
    recommendations.push('classDiagram');
  }

  // Sequence / Protocol / Network Handshake
  if (
    combined.includes('protocol') ||
    combined.includes('handshake') ||
    combined.includes('sequence') ||
    combined.includes('message') ||
    combined.includes('request') ||
    combined.includes('response') ||
    combined.includes('api') ||
    combined.includes('client-server') ||
    combined.includes('tcp') ||
    combined.includes('http')
  ) {
    recommendations.push('sequence');
  }

  // Block / Architecture
  if (
    combined.includes('architecture') ||
    combined.includes('microservice') ||
    combined.includes('tier') ||
    combined.includes('layer') ||
    combined.includes('system') ||
    combined.includes('component') ||
    combined.includes('hardware') ||
    combined.includes('infrastructure')
  ) {
    recommendations.push('block', 'architecture');
  }

  // Flowchart / Process / Lifecycle
  if (
    combined.includes('algorithm') ||
    combined.includes('process') ||
    combined.includes('step') ||
    combined.includes('cycle') ||
    combined.includes('flow') ||
    combined.includes('execution') ||
    combined.includes('schedule') ||
    combined.includes('paging') ||
    combined.includes('pipeline')
  ) {
    recommendations.push('flowchart', 'dfd');
  }

  // Use Case
  if (
    combined.includes('use case') ||
    combined.includes('actor') ||
    combined.includes('user story') ||
    combined.includes('requirement')
  ) {
    recommendations.push('usecase');
  }

  // Concept & Mindmap as universal academic anchors
  recommendations.push('mindmap', 'concept', 'flowchart');

  // De-duplicate while preserving prioritization
  return Array.from(new Set(recommendations));
};

// -----------------------------------------------------------------------------
// Deterministic Academic Heuristic Topic Extractor
// -----------------------------------------------------------------------------
export const extractTopicsHeuristic = (
  pdfResult: PdfExtractionResult,
  documentId: string,
  userId: string
): ExtractedTopic[] => {
  const extractedTopics: ExtractedTopic[] = [];
  const lines: Array<{ text: string; pageNumber: number }> = [];

  // Collect lines with their page attribution
  for (const page of pdfResult.pages) {
    const rawLines = page.text
      .split(/\r?\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const line of rawLines) {
      lines.push({ text: line, pageNumber: page.pageNumber });
    }
  }

  // Heading detection patterns
  const numberedPattern = /^(?:(?:Chapter|Unit|Module|Section)\s+)?(\d+(?:\.\d+)*)[:.)\s]+([A-Z][^\n.:]{2,80})$/i;
  const allCapsPattern = /^([A-Z0-9\s,&/-]{3,60})$/;
  const bulletPattern = /^[-*•]\s+([A-Z][^\n.:]{2,80})$/;

  let currentTopic: {
    topic_number: string;
    topic_title: string;
    subtopics: string[];
    contentParts: string[];
    pages: Set<number>;
  } | null = null;

  let topicCounter = 1;

  const commitTopic = () => {
    if (currentTopic && currentTopic.topic_title.length >= 3) {
      const content = currentTopic.contentParts.join('\n\n').trim();
      const pageList = Array.from(currentTopic.pages).sort((a, b) => a - b);
      extractedTopics.push({
        id: `topic_${documentId}_${extractedTopics.length + 1}`,
        document_id: documentId,
        user_id: userId,
        topic_number: currentTopic.topic_number || `${topicCounter}`,
        topic_title: currentTopic.topic_title,
        subtopics: currentTopic.subtopics.slice(0, 8),
        extracted_content: content || `Extracted topic covering ${currentTopic.topic_title} from the study notes.`,
        page_references: pageList.length > 0 ? pageList : [1],
        display_order: extractedTopics.length + 1,
        suggested_diagram_types: recommendDiagramTypes({
          title: currentTopic.topic_title,
          subtopics: currentTopic.subtopics,
          content,
        }),
      });
      topicCounter++;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const item = lines[i];
    const text = item.text;

    // Skip short noise or page headers/footers
    if (/^(page\s+\d+|\d+\s+of\s+\d+|\d+)$/i.test(text)) continue;

    // Check for Numbered Heading
    const numMatch = text.match(numberedPattern);
    if (numMatch) {
      commitTopic();
      currentTopic = {
        topic_number: numMatch[1],
        topic_title: numMatch[2].trim(),
        subtopics: [],
        contentParts: [],
        pages: new Set([item.pageNumber]),
      };
      continue;
    }

    // Check for All-Caps Heading (if length is concise)
    if (allCapsPattern.test(text) && text.split(/\s+/).length <= 8 && text.length >= 4) {
      // Avoid noise like "TABLE OF CONTENTS"
      if (!/table of contents|index|references|bibliography/i.test(text)) {
        commitTopic();
        currentTopic = {
          topic_number: `${topicCounter}`,
          topic_title: text.replace(/\b([A-Z])([A-Z]+)\b/g, (_, f, r) => f + r.toLowerCase()).trim(),
          subtopics: [],
          contentParts: [],
          pages: new Set([item.pageNumber]),
        };
        continue;
      }
    }

    // Check for bullet subtopics under current topic
    const bulletMatch = text.match(bulletPattern);
    if (bulletMatch && currentTopic) {
      const sub = bulletMatch[1].trim();
      if (!currentTopic.subtopics.includes(sub)) {
        currentTopic.subtopics.push(sub);
      }
      currentTopic.contentParts.push(text);
      currentTopic.pages.add(item.pageNumber);
      continue;
    }

    // Otherwise, append text to current topic content
    if (currentTopic) {
      currentTopic.contentParts.push(text);
      currentTopic.pages.add(item.pageNumber);
    } else {
      // Initial text before first explicit heading becomes Topic 1: Overview
      currentTopic = {
        topic_number: '1',
        topic_title: 'Overview & Fundamentals',
        subtopics: [],
        contentParts: [text],
        pages: new Set([item.pageNumber]),
      };
    }
  }

  // Commit last topic
  commitTopic();

  // If no topics extracted (e.g. text was dense paragraphs without standard headings),
  // chunk by paragraphs into logical study units
  if (extractedTopics.length === 0 && pdfResult.hasContent) {
    const paragraphs = pdfResult.fullText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 50);

    const step = Math.max(1, Math.ceil(paragraphs.length / 4));
    for (let c = 0; c < Math.min(6, Math.ceil(paragraphs.length / step)); c++) {
      const slice = paragraphs.slice(c * step, (c + 1) * step);
      const firstSentence = slice[0]?.split(/[.!?]/)[0] || `Section ${c + 1}`;
      const title = firstSentence.length <= 60 ? firstSentence : firstSentence.slice(0, 50) + '...';
      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim() || `Study Topic ${c + 1}`;

      extractedTopics.push({
        id: `topic_${documentId}_${c + 1}`,
        document_id: documentId,
        user_id: userId,
        topic_number: `${c + 1}`,
        topic_title: cleanTitle,
        subtopics: slice.slice(1, 4).map((p) => p.slice(0, 40) + '...'),
        extracted_content: slice.join('\n\n'),
        page_references: [Math.min(pdfResult.pageCount, c + 1)],
        display_order: c + 1,
        suggested_diagram_types: recommendDiagramTypes({
          title: cleanTitle,
          content: slice.join(' '),
        }),
      });
    }
  }

  return extractedTopics;
};

// -----------------------------------------------------------------------------
// AI Topic and Subtopic Extraction Engine (Gemini + Secure Fallback)
// -----------------------------------------------------------------------------
export const extractTopicsFromPdf = async (
  pdfResult: PdfExtractionResult,
  documentId: string,
  userId: string
): Promise<ExtractedTopic[]> => {
  if (!pdfResult.hasContent) {
    throw new Error(pdfResult.error || 'The uploaded PDF has no extractable text content.');
  }

  // Prepare safe text sample for AI prompt (up to 15,000 characters with page references)
  const sampledText = pdfResult.pages
    .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text.slice(0, 3000)}`)
    .join('\n\n')
    .slice(0, 18000);

  const prompt = `You are a university academic content analyzer.
Analyze the following extracted study notes from a student PDF.
Extract ALL distinct academic topics and subtopics strictly from the provided text in the exact document order.

STRICT RULES:
1. Extract topics ONLY from the text provided below. Do NOT hallucinate or invent topics.
2. Preserve original technical terminology, section numbers, and titles.
3. Identify nested subtopics and important key concepts.
4. Note which page numbers each topic appears on based on the '--- PAGE X ---' headers.
5. Provide a 2-4 sentence excerpt of the extracted source text for each topic.
6. Return a valid JSON array inside a "topics" property.

JSON Format:
{
  "topics": [
    {
      "topic_number": "1",
      "topic_title": "Topic Name",
      "subtopics": ["Subtopic A", "Subtopic B"],
      "extracted_content": "Exact relevant excerpt from notes...",
      "page_references": [1, 2]
    }
  ]
}

DOCUMENT CONTENT:
${sampledText}`;

  try {
    const res = await apiService.invokeGeminiAi({
      actionType: 'ai_notes' as any,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    if (res.success && res.data) {
      let parsed = res.data;
      if (typeof parsed === 'string') {
        const jsonMatch = parsed.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } else if (parsed.text) {
        const jsonMatch = parsed.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      const list = parsed.topics || parsed;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => {
          const title = String(item.topic_title || item.title || `Topic ${idx + 1}`).trim();
          const subtopics = Array.isArray(item.subtopics) ? item.subtopics.map(String) : [];
          const content = String(item.extracted_content || item.content || '').trim();
          const pages = Array.isArray(item.page_references)
            ? item.page_references.map((p: any) => Number(p)).filter((n: number) => !isNaN(n))
            : [1];

          return {
            id: `topic_${documentId}_${idx + 1}`,
            document_id: documentId,
            user_id: userId,
            topic_number: String(item.topic_number || `${idx + 1}`),
            topic_title: title,
            subtopics,
            extracted_content: content || `Extracted topic covering ${title}.`,
            page_references: pages.length > 0 ? pages : [1],
            display_order: idx + 1,
            suggested_diagram_types: recommendDiagramTypes({
              title,
              subtopics,
              content,
            }),
          };
        });
      }
    }
  } catch (err) {
    console.warn('Gemini topic extraction error, using heuristic fallback:', err);
  }

  // Resilient deterministic fallback
  return extractTopicsHeuristic(pdfResult, documentId, userId);
};

// -----------------------------------------------------------------------------
// Visual Diagram Synthesis Engine (Mermaid.js Generation & Sanitization)
// -----------------------------------------------------------------------------
export const generateDiagramForTopic = async (
  topic: ExtractedTopic,
  diagramType: DiagramType
): Promise<string> => {
  const cleanTitle = topic.topic_title.replace(/["'\\]/g, '').trim();
  const subtopicsText = (topic.subtopics || []).join(', ');

  const prompt = `Generate a syntactically correct and clean Mermaid.js diagram for the following study topic.
TOPIC: "${cleanTitle}"
SUBTOPICS: "${subtopicsText}"
SOURCE CONTENT: "${topic.extracted_content.slice(0, 1000)}"
DIAGRAM TYPE REQUESTED: "${diagramType}"

STRICT MERMAID SYNTAX RULES:
1. Output ONLY valid Mermaid.js code within \`\`\`mermaid ... \`\`\` block. No conversational filler.
2. For flowchart, use: flowchart TD
3. For sequence, use: sequenceDiagram with autonumber and actors
4. For mindmap, use: mindmap with root(("Topic")) and clean indented nodes without punctuation
5. For classDiagram, use: classDiagram with class definitions (+attr, +method) and inheritance/composition
6. For erDiagram, use: erDiagram with ENTITY ||--o{ OTHER_ENTITY : "verb"
7. Quote all node labels in double quotes, e.g. Node["Label text"] or Cyl[("Database")]
8. Quote all arrow text in double quotes: -->|"Label"|
9. Keep it focused, elegant, and directly rooted in the provided study material.`;

  try {
    const res = await apiService.invokeGeminiAi({
      actionType: 'ai_notes' as any,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    });

    if (res.success && res.data) {
      const rawText = typeof res.data === 'string' ? res.data : res.data.text || '';
      const mermaidMatch = rawText.match(/```(?:mermaid)?([\s\S]*?)```/);
      const code = mermaidMatch ? mermaidMatch[1].trim() : rawText.trim();
      if (code && (code.startsWith('flowchart') || code.startsWith('graph') || code.startsWith('sequenceDiagram') || code.startsWith('classDiagram') || code.startsWith('erDiagram') || code.startsWith('mindmap') || code.startsWith('stateDiagram'))) {
        return sanitizeMermaid(code);
      }
    }
  } catch (err) {
    console.warn('AI diagram generation fallback to heuristic synthesizer:', err);
  }

  // Heuristic Synthesizer for selected DiagramType
  return generateHeuristicMermaid(topic, diagramType);
};

// -----------------------------------------------------------------------------
// Heuristic Procedural Mermaid Code Generator
// -----------------------------------------------------------------------------
export const generateHeuristicMermaid = (
  topic: ExtractedTopic,
  type: DiagramType
): string => {
  const cleanTitle = topic.topic_title.replace(/[()[\]"']/g, '').trim();
  const subs = (topic.subtopics || []).map((s) => s.replace(/[()[\]"']/g, '').trim()).filter(Boolean);

  if (type === 'mindmap') {
    let mm = `mindmap\n  root(("${cleanTitle}"))\n`;
    if (subs.length > 0) {
      subs.forEach((s) => {
        mm += `    ${s.replace(/[^a-zA-Z0-9\s]/g, '')}\n`;
      });
    } else {
      mm += `    Core Principles\n      Definitions\n      Components\n    Applications\n      Implementation\n      Best Practices\n`;
    }
    return sanitizeMermaid(mm);
  }

  if (type === 'sequence') {
    let seq = `sequenceDiagram\n    autonumber\n    actor Student as Student\n    participant System as SANKALP Core\n    participant Engine as ${cleanTitle.slice(0, 20)} Module\n    participant DB as Campus Database\n\n`;
    seq += `    Student->>System: Initiate ${cleanTitle}\n`;
    seq += `    System->>Engine: Process Concept Parameters\n`;
    if (subs.length > 0) {
      subs.slice(0, 3).forEach((sub) => {
        seq += `    Engine->>DB: Query: ${sub.slice(0, 25)}\n`;
        seq += `    DB-->>Engine: Verified ${sub.slice(0, 25)}\n`;
      });
    } else {
      seq += `    Engine->>DB: Validate Resource Records\n`;
      seq += `    DB-->>Engine: Return Operational State\n`;
    }
    seq += `    Engine-->>System: Structure Learning Visuals\n`;
    seq += `    System-->>Student: Display Validated Concept Flow\n`;
    return sanitizeMermaid(seq);
  }

  if (type === 'classDiagram') {
    let cd = `classDiagram\n`;
    const mainClass = cleanTitle.replace(/[^a-zA-Z0-9]/g, '') || 'ConceptRoot';
    cd += `    class ${mainClass} {\n      +UUID id\n      +String title\n      +Boolean isActive\n      +executeProcess()\n      +validateState()\n    }\n`;

    if (subs.length > 0) {
      subs.slice(0, 3).forEach((s, i) => {
        const subClass = s.replace(/[^a-zA-Z0-9]/g, '') || `SubComponent${i + 1}`;
        cd += `    class ${subClass} {\n      +String name\n      +applyRule()\n    }\n`;
        cd += `    ${mainClass} "1" *-- "*" ${subClass} : contains\n`;
      });
    } else {
      cd += `    class ComponentSpec {\n      +String name\n      +checkConstraints()\n    }\n`;
      cd += `    ${mainClass} "1" --> "*" ComponentSpec : configures\n`;
    }
    return sanitizeMermaid(cd);
  }

  if (type === 'erDiagram') {
    let er = `erDiagram\n`;
    const entityA = (cleanTitle.split(/\s+/)[0] || 'TOPIC').toUpperCase();
    er += `    ${entityA} ||--o{ SUBTOPIC : contains\n`;
    er += `    ${entityA} ||--|| METADATA : defines\n`;
    er += `    ${entityA} {\n        uuid id PK\n        string name\n        string category\n    }\n`;
    er += `    SUBTOPIC {\n        uuid id PK\n        uuid parent_id FK\n        string title\n    }\n`;
    er += `    METADATA {\n        uuid id PK\n        string version\n        timestamp updated_at\n    }\n`;
    return sanitizeMermaid(er);
  }

  if (type === 'block' || type === 'architecture') {
    let arch = `flowchart TD\n`;
    arch += `    subgraph ClientLayer["1. Interface & Interaction Layer"]\n`;
    arch += `        UI["Student Workspace: ${cleanTitle}"]\n`;
    arch += `    end\n\n`;
    arch += `    subgraph CoreLayer["2. Logic & Processing Engine"]\n`;
    if (subs.length > 0) {
      subs.slice(0, 3).forEach((s, i) => {
        arch += `        Mod${i + 1}["${s}"]\n`;
      });
    } else {
      arch += `        Proc["Execution Engine"]\n`;
      arch += `        Validator["Integrity Validator"]\n`;
    }
    arch += `    end\n\n`;
    arch += `    subgraph StorageLayer["3. Secure Persistence Layer"]\n`;
    arch += `        DB[("PostgreSQL + Supabase RLS")]\n`;
    arch += `    end\n\n`;
    arch += `    ClientLayer --> CoreLayer\n`;
    arch += `    CoreLayer --> StorageLayer\n`;
    return sanitizeMermaid(arch);
  }

  if (type === 'dfd') {
    let dfd = `flowchart LR\n`;
    dfd += `    Source["Student Input"] -->|"Raw Parameters"| Process1["Process: ${cleanTitle}"]\n`;
    if (subs.length > 0) {
      subs.slice(0, 3).forEach((s, idx) => {
        dfd += `    Process1 -->|"Pass to Step ${idx + 1}"| SubProc${idx + 1}["${s}"]\n`;
        dfd += `    SubProc${idx + 1} --> Store[("Topic Knowledge Store")]\n`;
      });
    } else {
      dfd += `    Process1 -->|"Formatted Data"| Store[("Topic Knowledge Store")]\n`;
    }
    dfd += `    Store -->|"Retrieve Record"| Output["Interactive Visual Display"]\n`;
    return sanitizeMermaid(dfd);
  }

  // Default: Flowchart TD
  let flow = `flowchart TD\n`;
  flow += `    Start(["Start: ${cleanTitle}"]) --> Step1["1. Identify Core Concepts"]\n`;
  if (subs.length > 0) {
    subs.slice(0, 4).forEach((s, i) => {
      const prev = i === 0 ? 'Step1' : `Sub${i}`;
      flow += `    ${prev} --> Sub${i + 1}["${i + 2}. ${s}"]\n`;
    });
    flow += `    Sub${Math.min(subs.length, 4)} --> Decision{"Verification Complete?"}\n`;
  } else {
    flow += `    Step1 --> Step2["2. Analyze Structural Dependencies"]\n`;
    flow += `    Step2 --> Decision{"Requirements Met?"}\n`;
  }
  flow += `    Decision -->|"Yes"| Success["Finalize & Synthesize Visual"]\n`;
  flow += `    Decision -->|"No"| Retry["Review Source Material"]\n`;
  flow += `    Retry --> Step1\n`;
  flow += `    Success --> Finish(["End: Knowledge Integrated"])\n`;
  return sanitizeMermaid(flow);
};
