// ==============================================================================
// SANKALP — Production-Grade PDF Text & Page Extraction Engine
// Supports Plaintext, Compressed (FlateDecode), Hex-encoded, & Multi-page PDFs
// ==============================================================================

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface ExtractedPdfDocument {
  text: string;
  pageCount: number;
  pages: ExtractedPdfPage[];
  isEncrypted: boolean;
  hasContent: boolean;
  isScanned: boolean;
  error?: string;
}

export const MAX_SAFE_PAGES = 50;
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates PDF format, integrity, and file size constraints.
 */
export const validatePdfFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return { valid: false, error: 'Only PDF documents (.pdf) are supported.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The uploaded PDF file is empty (0 bytes).' };
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `PDF file size exceeds maximum limit of 10MB (Current: ${sizeMb}MB).`,
    };
  }
  return { valid: true };
};

/**
 * Decompresses zlib/deflate compressed stream bytes using native Web Streams (DecompressionStream)
 * with automatic fallback between RFC 1950 (deflate), RFC 1951 (deflate-raw), and Latin-1.
 */
export const decompressFlateStream = async (bytes: Uint8Array): Promise<string> => {
  if (!bytes || bytes.length === 0) return '';

  // 1. Try standard zlib RFC 1950 (DecompressionStream 'deflate')
  if (typeof DecompressionStream !== 'undefined' && typeof Response !== 'undefined') {
    try {
      const respStream = new Response(bytes as any).body?.pipeThrough(
        new DecompressionStream('deflate')
      );
      if (respStream) {
        const decompressedBuffer = await new Response(respStream).arrayBuffer();
        return new TextDecoder('latin1').decode(decompressedBuffer);
      }
    } catch {
      // Fall through to deflate-raw
    }

    // 2. Try raw deflate RFC 1951 (DecompressionStream 'deflate-raw')
    try {
      let rawBytes = bytes;
      if (bytes.length > 6 && bytes[0] === 0x78) {
        rawBytes = bytes.subarray(2, bytes.length - 4);
      }
      const respStream = new Response(rawBytes as any).body?.pipeThrough(
        new DecompressionStream('deflate-raw')
      );
      if (respStream) {
        const decompressedBuffer = await new Response(respStream).arrayBuffer();
        return new TextDecoder('latin1').decode(decompressedBuffer);
      }
    } catch {
      // Fall through
    }
  }

  // Fallback to latin1 string decoding of uncompressed segments
  return new TextDecoder('latin1').decode(bytes);
};

/**
 * Decodes a hexadecimal string literal from a PDF operator (e.g. <48656C6C6F>).
 */
export const decodeHexPdfString = (hex: string): string => {
  const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');
  if (cleanHex.length === 0) return '';

  // Check for UTF-16BE BOM (FE FF)
  if (cleanHex.toUpperCase().startsWith('FEFF')) {
    let result = '';
    for (let i = 4; i < cleanHex.length; i += 4) {
      const charCode = parseInt(cleanHex.substring(i, i + 4), 16);
      if (!isNaN(charCode) && charCode > 0) {
        result += String.fromCharCode(charCode);
      }
    }
    return result;
  }

  // Standard ASCII / Latin1 Hex String
  let result = '';
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    if (!isNaN(byte) && byte >= 32 && byte <= 126) {
      result += String.fromCharCode(byte);
    } else if (byte === 10 || byte === 13 || byte === 9) {
      result += ' ';
    }
  }
  return result;
};

/**
 * Unescapes special characters and octal values inside PDF string parentheses.
 */
export const unescapePdfString = (str: string): string => {
  return str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\b/g, '')
    .replace(/\\f/g, '')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
};

/**
 * Parses all PDF text drawing operators inside BT ... ET text blocks.
 */
export const parseTextOperators = (streamContent: string): string => {
  if (!streamContent) return '';

  const textLines: string[] = [];
  const btEtRegex = /BT[\s\S]*?ET/g;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = btEtRegex.exec(streamContent)) !== null) {
    const block = blockMatch[0];
    const currentBlockText: string[] = [];

    // Match (string) Tj or ' or "
    const tjRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const clean = unescapePdfString(tjMatch[1]);
      if (clean) currentBlockText.push(clean);
    }

    // Match <hex> Tj
    const hexTjRegex = /<([0-9A-Fa-f\s]+)>\s*(?:Tj|'|")/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexTjRegex.exec(block)) !== null) {
      const decoded = decodeHexPdfString(hexMatch[1]);
      if (decoded) currentBlockText.push(decoded);
    }

    // Match array strings: [ (str1) 120 (str2) ... ] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    let arrMatch: RegExpExecArray | null;
    while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = arrMatch[1];
      // Match each token: either (string), <hex>, or spacing number
      const tokenRegex = /\(([^)]*)\)|<([0-9A-Fa-f\s]+)>|(-?\d+(?:\.\d+)?)/g;
      let token: RegExpExecArray | null;
      let lineAccum = '';

      while ((token = tokenRegex.exec(inner)) !== null) {
        if (token[1] !== undefined) {
          // Parenthesized string
          lineAccum += unescapePdfString(token[1]);
        } else if (token[2] !== undefined) {
          // Hex string
          lineAccum += decodeHexPdfString(token[2]);
        } else if (token[3] !== undefined) {
          // Spacing number: negative kerning implies word gap
          const kerning = parseFloat(token[3]);
          if (kerning <= -100 && lineAccum.length > 0 && !lineAccum.endsWith(' ')) {
            lineAccum += ' ';
          }
        }
      }

      if (lineAccum.trim()) {
        currentBlockText.push(lineAccum.trim());
      }
    }

    if (currentBlockText.length > 0) {
      textLines.push(currentBlockText.join(' '));
    }
  }

  // Fallback: If no explicit BT/ET blocks were matched (e.g. truncated or atypical streams)
  if (textLines.length === 0) {
    const rawTjRegex = /\(([^)]+)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = rawTjRegex.exec(streamContent)) !== null) {
      const clean = unescapePdfString(m[1]);
      if (clean.length > 2) textLines.push(clean);
    }
  }

  return textLines
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extracts binary stream slices from raw PDF buffer given byte start & end.
 */
interface RawStreamInfo {
  start: number;
  end: number;
  isFlate: boolean;
  isImage: boolean;
}

/**
 * Locates all streams in the PDF byte array with their byte offsets and dictionary headers.
 */
const findStreamsInPdf = (pdfBytes: Uint8Array, pdfString: string): RawStreamInfo[] => {
  const streams: RawStreamInfo[] = [];
  const streamRegex = /stream\r?\n/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(pdfString)) !== null) {
    const streamStart = match.index + match[0].length;
    const endIdx = pdfString.indexOf('endstream', streamStart);
    if (endIdx === -1) continue;

    let streamEnd = endIdx;
    if (pdfString[streamEnd - 1] === '\n') streamEnd--;
    if (pdfString[streamEnd - 1] === '\r') streamEnd--;

    // Read dictionary header preceding the stream keyword (up to 400 chars back)
    const dictStart = Math.max(0, match.index - 400);
    const headerSlice = pdfString.substring(dictStart, match.index);

    const isFlate = /\/Filter\s*\/FlateDecode|\/Filter\/FlateDecode/.test(headerSlice);
    const isImage = /\/Subtype\s*\/Image|\/Subtype\/Image/.test(headerSlice);

    streams.push({
      start: streamStart,
      end: streamEnd,
      isFlate,
      isImage,
    });
  }

  return streams;
};

/**
 * Extracts complete text page by page in sequential numerical order from a PDF document.
 */
export const extractPdfDocument = async (
  input: File | ArrayBuffer | Uint8Array,
  options?: { maxPages?: number }
): Promise<ExtractedPdfDocument> => {
  const maxPages = options?.maxPages || MAX_SAFE_PAGES;

  let buffer: ArrayBuffer;
  if (input instanceof File) {
    buffer = await input.arrayBuffer();
  } else if (input instanceof ArrayBuffer) {
    buffer = input;
  } else {
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  }

  const bytes = new Uint8Array(buffer);
  const pdfString = new TextDecoder('latin1').decode(bytes);

  // 1. Encryption check
  if (pdfString.includes('/Encrypt')) {
    return {
      text: '',
      pageCount: 0,
      pages: [],
      isEncrypted: true,
      hasContent: false,
      isScanned: false,
      error: 'This PDF is password-protected or encrypted. Please upload an unprotected version.',
    };
  }

  // 2. Parse PDF Objects Map (e.g. "5 0 obj ... endobj")
  const objMap = new Map<string, { body: string; offset: number }>();
  const objRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
  let objMatch: RegExpExecArray | null;

  while ((objMatch = objRegex.exec(pdfString)) !== null) {
    const id = objMatch[1];
    objMap.set(id, { body: objMatch[3], offset: objMatch.index });
  }

  // 3. Find Page objects: /Type /Page
  const pageEntries: Array<{ pageId: string; contentsIds: string[] }> = [];

  for (const [id, { body }] of objMap.entries()) {
    if (/\/Type\s*\/Page\b/.test(body) && !/\/Type\s*\/Pages\b/.test(body)) {
      // Find /Contents references: either single "Contents 12 0 R" or array "Contents [ 12 0 R 13 0 R ]"
      const contentsIds: string[] = [];
      const singleMatch = body.match(/\/Contents\s+(\d+)\s+\d+\s+R/);
      if (singleMatch) {
        contentsIds.push(singleMatch[1]);
      } else {
        const arrayMatch = body.match(/\/Contents\s*\[([^\]]+)\]/);
        if (arrayMatch) {
          const idRegex = /(\d+)\s+\d+\s+R/g;
          let idM: RegExpExecArray | null;
          while ((idM = idRegex.exec(arrayMatch[1])) !== null) {
            contentsIds.push(idM[1]);
          }
        }
      }
      pageEntries.push({ pageId: id, contentsIds });
    }
  }

  // 4. Extract Text Page by Page preserving document order
  const pages: ExtractedPdfPage[] = [];
  const allStreams = findStreamsInPdf(bytes, pdfString);

  if (pageEntries.length > 0) {
    const safeLimit = Math.min(pageEntries.length, maxPages);

    for (let pIdx = 0; pIdx < safeLimit; pIdx++) {
      const entry = pageEntries[pIdx];
      const pageNum = pIdx + 1;
      const pageTextParts: string[] = [];

      // Check if page object itself contains inline text operators (e.g. mock/compact PDFs)
      const directPageBody = objMap.get(entry.pageId)?.body || '';
      const directText = parseTextOperators(directPageBody);
      if (directText) {
        pageTextParts.push(directText);
      }

      for (const cId of entry.contentsIds) {
        const contentObj = objMap.get(cId);
        if (!contentObj) continue;

        const bodyStr = contentObj.body;
        const streamIdx = bodyStr.indexOf('stream');
        if (streamIdx === -1) {
          // Content object without stream tag: parse direct operators
          const unstreamedText = parseTextOperators(bodyStr);
          if (unstreamedText) pageTextParts.push(unstreamedText);
          continue;
        }

        let sStart = streamIdx + 6;
        if (bodyStr[sStart] === '\r') sStart++;
        if (bodyStr[sStart] === '\n') sStart++;

        let sEnd = bodyStr.indexOf('endstream', sStart);
        if (sEnd === -1) sEnd = bodyStr.length;
        if (bodyStr[sEnd - 1] === '\n') sEnd--;
        if (bodyStr[sEnd - 1] === '\r') sEnd--;

        const isFlate = /\/Filter\s*\/FlateDecode|\/Filter\/FlateDecode/.test(bodyStr);
        const streamSliceStr = bodyStr.substring(sStart, sEnd);
        const streamBytes = new Uint8Array(
          Array.from(streamSliceStr).map((c) => c.charCodeAt(0))
        );

        let decodedStream = '';
        if (isFlate) {
          decodedStream = await decompressFlateStream(streamBytes);
        } else {
          decodedStream = streamSliceStr;
        }

        const text = parseTextOperators(decodedStream);
        if (text) pageTextParts.push(text);
      }

      const fullPageText = pageTextParts.join('\n\n').trim();
      pages.push({
        pageNumber: pageNum,
        text: fullPageText,
        charCount: fullPageText.length,
      });
    }
  }

  // 5. Fallback: If no /Type /Page objects were resolved or all pages were empty,
  // scan all non-image streams sequentially
  const totalPageChars = pages.reduce((acc, p) => acc + p.charCount, 0);
  if (pages.length === 0 || totalPageChars < 25) {
    const contentStreams = allStreams.filter((s) => !s.isImage);
    const fallbackPageTexts: string[] = [];

    for (let i = 0; i < Math.min(contentStreams.length, maxPages); i++) {
      const s = contentStreams[i];
      const slice = bytes.subarray(s.start, s.end);

      let decoded = '';
      if (s.isFlate) {
        decoded = await decompressFlateStream(slice);
      } else {
        decoded = new TextDecoder('latin1').decode(slice);
      }

      const extracted = parseTextOperators(decoded);
      if (extracted.trim().length > 0) {
        fallbackPageTexts.push(extracted.trim());
      }
    }

    if (fallbackPageTexts.length > 0) {
      pages.length = 0; // Clear empty placeholder pages
      fallbackPageTexts.forEach((t, idx) => {
        pages.push({
          pageNumber: idx + 1,
          text: t,
          charCount: t.length,
        });
      });
    }
  }

  // 6. Aggregate results
  const fullText = pages
    .filter((p) => p.text.length > 0)
    .map((p) => (pages.length > 1 ? `--- Page ${p.pageNumber} ---\n${p.text}` : p.text))
    .join('\n\n')
    .trim();

  const totalChars = pages.reduce((acc, p) => acc + p.charCount, 0);
  const hasContent = totalChars >= 30;

  // Detect whether document is a scanned image
  const hasImages = allStreams.some((s) => s.isImage);
  const isScanned = !hasContent && (hasImages || pdfString.includes('/Image') || totalChars === 0);

  return {
    text: fullText,
    pageCount: pages.length || 1,
    pages,
    isEncrypted: false,
    hasContent,
    isScanned,
  };
};
