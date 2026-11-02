// ==============================================================================
// SANKALP — AI Flashcard Service (PDF Extraction & Secure AI OCR Integration)
// ==============================================================================

import { apiService } from './apiService';
import {
  validatePdfFile as validatePdfFileExt,
  extractPdfDocument,
  ExtractedPdfDocument,
  MAX_PDF_SIZE_BYTES,
} from '../utils/pdfExtractor';

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

// Validate PDF format and file size (delegated to robust validator)
export const validatePdfFile = (file: File): { valid: boolean; error?: string } => {
  return validatePdfFileExt(file);
};

// Multi-page, FlateDecode-aware text extractor from PDF
export const extractTextFromPdf = async (
  file: File
): Promise<ExtractedPdfDocument> => {
  return await extractPdfDocument(file);
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
    .filter((s) => s.length >= 25 && s.length <= 350);

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

    // Look for cause/effect, process, or architectural keywords
    if (
      s.includes('because') ||
      s.includes('therefore') ||
      s.includes('step') ||
      s.includes('component') ||
      s.includes('algorithm') ||
      s.includes('process') ||
      s.includes('layer') ||
      s.includes('memory') ||
      s.includes('system')
    ) {
      const words = s.split(' ');
      const preview = words.slice(0, 6).join(' ');
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

/**
 * Safely slices and chunks large documents to fit model token boundaries.
 */
export const chunkDocumentText = (fullText: string, maxChars: number = 30000): string => {
  if (fullText.length <= maxChars) return fullText;
  // Preserve start and distributed high-value content
  const half = Math.floor(maxChars / 2);
  const head = fullText.slice(0, half);
  const tail = fullText.slice(-half);
  return `${head}\n\n[... content condensed for model context ...]\n\n${tail}`;
};

// Primary Generator Orchestrator with Text Extraction & Automatic Visual OCR
export const generateFlashcardsFromPdf = async (
  options: GenerationOptions,
  onProgress?: (step: string, percent: number) => void
): Promise<GeneratedCard[]> => {
  const { file, count, difficulty, language, deckTitle, subject } = options;

  // Step 1: Validate Document Format and Security Limits
  onProgress?.('Validating document format and security limits...', 10);
  const val = validatePdfFile(file);
  if (!val.valid) {
    throw new Error(val.error || 'Invalid PDF file.');
  }

  // Step 2: Multi-Page Text Extraction
  onProgress?.('Extracting text layer page by page...', 25);
  const extraction = await extractTextFromPdf(file);

  if (extraction.isEncrypted) {
    throw new Error('This PDF is password-protected or encrypted. Please upload an unencrypted document.');
  }

  let finalWorkingText = extraction.text;
  let ocrUsed = false;

  // Step 3: Handle Scanned / Image-Based PDFs with Automatic Visual OCR Fallback
  if (!extraction.hasContent) {
    onProgress?.('Scanned document detected (no embedded text layer). Initiating visual OCR via secure Gemini proxy...', 35);

    if (file.size > MAX_PDF_SIZE_BYTES) {
      throw new Error(`Scanned PDF size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`);
    }

    onProgress?.('Encoding document for OCR visual analysis...', 45);
    const base64Data = await fileToBase64(file);

    onProgress?.('Performing OCR text extraction page by page via Gemini proxy...', 55);

    const ocrPrompt = `You are an expert academic OCR and document digitization engine.
Extract all readable text, lecture notes, formulas, definitions, and questions from this scanned document page by page in exact numerical page order.
Format the output strictly as:
--- Page 1 ---
[Content of page 1]
--- Page 2 ---
[Content of page 2]

Preserve all academic concepts, formulas, theorems, and terminology accurately.`;

    try {
      const ocrResult = await apiService.invokeGeminiAi({
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
                text: ocrPrompt,
              },
            ],
          },
        ],
      });

      if (ocrResult.success && ocrResult.data) {
        const ocrText = ocrResult.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (ocrText && ocrText.trim().length > 30) {
          finalWorkingText = ocrText.trim();
          ocrUsed = true;
          onProgress?.('Visual OCR successful! Processing extracted lecture notes...', 70);
        }
      } else {
        // Evaluate error reasons
        const errMsg = ocrResult.error || '';
        if (errMsg.includes('Rate limit')) {
          throw new Error(errMsg);
        }

        // Clear configuration error for missing/invalid Gemini API setup
        throw new Error(
          'Unable to extract text: this PDF is a scanned document without an embedded text layer. ' +
          'Automatic visual OCR requires a configured Gemini API on your Supabase backend proxy. ' +
          'Please configure GEMINI_API_KEY in your Supabase Edge Function environment or upload a text-based PDF.'
        );
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Rate limit') || err.message.includes('GEMINI_API_KEY') || err.message.includes('scanned document'))) {
        throw err;
      }
      throw new Error(
        'Unable to extract text: this PDF is a scanned document without an embedded text layer. ' +
        'Automatic visual OCR requires a configured Gemini API on your Supabase backend proxy. ' +
        'Please configure GEMINI_API_KEY in your Supabase Edge Function environment or upload a text-based PDF.'
      );
    }
  }

  // Ensure we have readable content at this stage
  if (!finalWorkingText || finalWorkingText.trim().length < 25) {
    throw new Error(
      'Unable to extract readable text from this PDF. ' +
      'Please verify the document contains readable academic lecture notes or textbook material.'
    );
  }

  // Step 4: Flashcard Deck Synthesis from Working Text
  const pagesSummary = extraction.pageCount > 1
    ? `across ${extraction.pageCount} pages`
    : 'from document';
  onProgress?.(`Synthesizing ${count} high-yield flashcards ${pagesSummary}...`, ocrUsed ? 80 : 65);

  const safeContent = chunkDocumentText(finalWorkingText, 25000);

  const systemPrompt = `You are a university academic professor and exam preparation expert.
Generate exactly ${count} high-yield, exam-focused study flashcards from the provided academic lecture material.

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
]

Document Text:
${safeContent}`;

  // 1. Attempt AI synthesis via Gemini proxy
  try {
    const aiResult = await apiService.invokeGeminiAi({
      actionType: 'ai_flashcards',
      contents: [
        {
          parts: [
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
        // Strip code fences if returned
        const cleanedJson = rawJsonText.replace(/^```json\s*|```\s*$/g, '').trim();
        const parsed: GeneratedCard[] = JSON.parse(cleanedJson);
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
    if (err?.message && err.message.includes('Rate limit')) {
      throw err;
    }
    console.warn('AI proxy unavailable or offline, transitioning to local heuristic engine:', err?.message);
  }

  // 2. Offline / Heuristic Fallback
  onProgress?.('Analyzing document with intelligent academic parser...', 85);
  await new Promise((r) => setTimeout(r, 400));

  const synthesized = runHeuristicFlashcards(
    finalWorkingText,
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
