// ==============================================================================
// SANKALP — AI Flashcard Service (PDF Extraction & Secure AI Integration)
// ==============================================================================

import { apiService } from './apiService';

export interface GeneratedCard {
  id?: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GenerationOptions {
  file: File;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  language: 'English' | 'Hindi' | 'Hinglish';
  deckTitle: string;
  subject?: string;
}

// Convert File to Base64 String
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip metadata prefix like "data:application/pdf;base64,"
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Validate PDF format and file size (Enforcing Phase 5 limit of 10MB)
export const validatePdfFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return { valid: false, error: 'Only PDF documents (.pdf) are supported.' };
  }
  // Enforce server-safe max size: 10 MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `PDF file size exceeds maximum limit of 10MB (Current: ${(file.size / (1024 * 1024)).toFixed(1)}MB).` };
  }
  if (file.size === 0) {
    return { valid: false, error: 'Uploaded PDF file is empty (0 bytes).' };
  }
  return { valid: true };
};

// Client-side text extractor from PDF ArrayBuffer
export const extractTextFromPdf = async (file: File): Promise<{ text: string; isEncrypted: boolean; hasContent: boolean }> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const latinText = new TextDecoder('latin1').decode(bytes);

  // Check for PDF encryption dictionary
  if (latinText.includes('/Encrypt')) {
    return { text: '', isEncrypted: true, hasContent: false };
  }

  // Extract text strings inside text blocks BT ... ET
  const textChunks: string[] = [];
  const btEtRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = btEtRegex.exec(latinText)) !== null) {
    const block = match[0];
    // Find strings in (parentheses) preceding Tj or TJ
    const strRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let strMatch: RegExpExecArray | null;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const clean = strMatch[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 0) {
        textChunks.push(clean);
      }
    }

    // Also parse array of strings in [ (str1) 12 (str2) ] TJ
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
      if (combined.trim().length > 0) {
        textChunks.push(combined.trim());
      }
    }
  }

  const extracted = textChunks.join(' ').replace(/\s{2,}/g, ' ').trim();
  const hasContent = extracted.length > 40;

  return {
    text: extracted,
    isEncrypted: false,
    hasContent,
  };
};

// Fallback: Academic Heuristic Synthesizer (Generates grounded flashcards from extracted text)
export const runHeuristicFlashcards = (
  text: string,
  count: number,
  subject: string,
  deckTitle: string,
  difficulty: string
): GeneratedCard[] => {
  const cards: GeneratedCard[] = [];
  const clean = text.replace(/\r?\n/g, ' ').trim();

  // Split into sentences
  const sentences = clean
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 300);

  // Pattern match definition sentences ("is defined as", "is a", "refers to", "consists of", "used for")
  const defPattern = /\b([A-Z][a-zA-Z0-9\s-]{2,40})\s+(?:is defined as|is a|is an|refers to|consists of|stands for|is used to|represents|means)\s+([^.]+)/i;

  for (const s of sentences) {
    if (cards.length >= count) break;
    const m = s.match(defPattern);
    if (m) {
      const term = m[1].trim();
      const explanation = m[2].trim();
      if (term.length > 2 && explanation.length > 10 && !cards.some((c) => c.question.includes(term))) {
        cards.push({
          question: `What is ${term}, and what is its primary function?`,
          answer: `${term} ${s.slice(s.indexOf(term) + term.length).trim()}`,
          hint: `Core concept in ${subject || deckTitle}`,
          difficulty: difficulty === 'mixed' ? (cards.length % 3 === 0 ? 'easy' : cards.length % 3 === 1 ? 'medium' : 'hard') : (difficulty as any),
        });
      }
    }
  }

  // If still need more, construct concept explanation cards from informative sentences
  for (const s of sentences) {
    if (cards.length >= count) break;
    if (cards.some((c) => c.answer.includes(s))) continue;

    // Look for cause/effect or step keywords
    if (s.includes('because') || s.includes('therefore') || s.includes('step') || s.includes('component') || s.includes('algorithm') || s.includes('process')) {
      const words = s.split(' ');
      const preview = words.slice(0, 5).join(' ');
      cards.push({
        question: `Explain the concept regarding: "${preview}..."`,
        answer: s,
        hint: `Key point from ${deckTitle}`,
        difficulty: difficulty === 'mixed' ? 'medium' : (difficulty as any),
      });
    }
  }

  // Ensure minimum cards are provided if document was sparse
  let fallbackIdx = 1;
  while (cards.length < Math.min(count, 5)) {
    cards.push({
      question: `Key Takeaway ${fallbackIdx} from ${deckTitle}: Core Principles`,
      answer: sentences[fallbackIdx - 1] || `Review key lecture notes for ${deckTitle} and associated course materials.`,
      hint: `Foundational concept`,
      difficulty: 'medium',
    });
    fallbackIdx++;
  }

  return cards.slice(0, count);
};

// Primary Generator Orchestrator
export const generateFlashcardsFromPdf = async (
  options: GenerationOptions,
  onProgress?: (step: string, percent: number) => void
): Promise<GeneratedCard[]> => {
  const { file, count, difficulty, language, deckTitle, subject } = options;

  onProgress?.('Validating document format and security...', 15);
  const val = validatePdfFile(file);
  if (!val.valid) {
    throw new Error(val.error || 'Invalid PDF file.');
  }

  onProgress?.('Extracting text content from PDF...', 30);
  const extraction = await extractTextFromPdf(file);
  if (extraction.isEncrypted) {
    throw new Error('This PDF is password-protected or encrypted. Please upload an unencrypted document.');
  }

  // 1. Attempt Server-Side Gemini Proxy via Supabase Edge Function
  try {
    onProgress?.('Encoding document for AI analysis...', 45);
    const base64Data = await fileToBase64(file);

    onProgress?.(`Synthesizing ${count} high-yield flashcards with AI model...`, 70);

    const systemPrompt = `You are a university academic professor and exam preparation expert.
Generate exactly ${count} high-yield, exam-focused study flashcards from the provided academic PDF.

Deck Title: "${deckTitle}"
Subject: "${subject || 'General Academic'}"
Difficulty Level: "${difficulty}" (easy, medium, hard, or mixed)
Language: "${language}"

Guidelines:
1. Extract the most important concepts, definitions, formulas, algorithms, theorems, and explanations.
2. Formulate clear, specific Question prompts for the front of each card.
3. Provide concise, accurate, and complete Answers for the back.
4. Include a short helpful 1-sentence Hint for each card.
5. Difficulty should be one of: 'easy', 'medium', or 'hard'.
6. Do NOT invent information; use strictly facts present in or directly derived from the document.
7. Return ONLY valid JSON matching this schema:
[
  {
    "question": "Clear question prompt",
    "answer": "Concise, precise explanation or formula",
    "hint": "Brief memory clue",
    "difficulty": "easy" | "medium" | "hard"
  }
]`;

    const aiResult = await apiService.invokeGeminiAi({
      actionType: 'ai_flashcards',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    if (aiResult.success && aiResult.data) {
      const rawJsonText = aiResult.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJsonText) {
        const parsed: GeneratedCard[] = JSON.parse(rawJsonText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onProgress?.('Finalizing flashcard deck preview...', 100);
          return parsed.slice(0, count).map((c, i) => ({
            ...c,
            id: `ai_${Date.now()}_${i}`,
            difficulty: (['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium') as any,
          }));
        }
      }
    }
  } catch (err: any) {
    // If rate limited, propagate rate limit message directly
    if (err?.message && err.message.includes('Rate limit')) {
      throw err;
    }
    console.warn('AI proxy unavailable or offline, transitioning to local heuristic engine:', err?.message);
  }

  // Offline / Heuristic Fallback
  onProgress?.('Analyzing document with intelligent academic parser...', 65);
  await new Promise((r) => setTimeout(r, 600));

  if (!extraction.hasContent) {
    throw new Error('Unable to extract readable text from this PDF. The document may be a scanned image without an OCR text layer. Please configure a Gemini API key in settings for automatic visual OCR.');
  }

  onProgress?.(`Generating ${count} flashcards from extracted lecture notes...`, 90);
  await new Promise((r) => setTimeout(r, 400));

  const synthesized = runHeuristicFlashcards(
    extraction.text,
    count,
    subject || 'General',
    deckTitle,
    difficulty
  );

  onProgress?.('Flashcard deck preview ready!', 100);
  return synthesized.map((c, i) => ({
    ...c,
    id: `heu_${Date.now()}_${i}`,
  }));
};

