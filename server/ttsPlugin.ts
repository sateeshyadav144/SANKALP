// ==============================================================================
// SANKALP — Server-Side Multilingual Cloud TTS Middleware for Vite
// ==============================================================================

import type { Plugin } from 'vite';
import https from 'node:https';

const SUPPORTED_CLOUD_ISOS = new Set([
  'hi', 'en-in', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur', 'ne'
]);

// Sliding-window rate limiter per IP: max 30 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  if (entry.count >= 30) {
    return true;
  }
  entry.count++;
  return false;
}

function splitIntoChunks(text: string, maxLen: number = 180): string[] {
  const raw = text.replace(/\r/g, '').trim();
  const sentences = raw.split(/(?<=[.?!।\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if ((current + ' ' + t).trim().length <= maxLen) {
      current = (current + ' ' + t).trim();
    } else {
      if (current) chunks.push(current);
      if (t.length > maxLen) {
        const words = t.split(/\s+/);
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      } else {
        current = t;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function fetchAudioChunk(text: string, lang: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
    https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Upstream TTS returned HTTP ${res.statusCode}`));
        }
        const data: Buffer[] = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
      }
    ).on('error', reject);
  });
}

export function ttsServerPlugin(): Plugin {
  return {
    name: 'sankalp-tts-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/tts/synthesize' && req.method === 'POST') {
          const clientIp = (req.socket.remoteAddress || '127.0.0.1').toString();

          if (isRateLimited(clientIp)) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Too many speech requests. Please wait a moment.' }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
            // Guard against massive payloads (>1MB)
            if (bodyStr.length > 1024 * 1024) {
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Payload too large.' }));
              req.destroy();
            }
          });

          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { text, languageCode = 'hi-IN', iso = 'hi' } = body;

              if (!text || typeof text !== 'string' || !text.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Text content is required.' }));
                return;
              }

              if (text.length > 5000) {
                res.statusCode = 413;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Text exceeds maximum length of 5,000 characters.' }));
                return;
              }

              const targetIso = (iso || languageCode.split('-')[0]).toLowerCase();
              const normalizedIso = targetIso === 'en' ? 'en-in' : targetIso;

              if (!SUPPORTED_CLOUD_ISOS.has(normalizedIso)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: `Language '${languageCode}' is not supported by current Cloud TTS provider.`,
                    unsupported: true,
                  })
                );
                return;
              }

              const chunks = splitIntoChunks(text);
              const buffers: Buffer[] = [];

              for (const chunk of chunks) {
                const buf = await fetchAudioChunk(chunk, normalizedIso);
                buffers.push(buf);
              }

              const combined = Buffer.concat(buffers);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Content-Length', combined.length.toString());
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.end(combined);
            } catch (err: any) {
              console.error('TTS middleware synthesis error:', err.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Speech synthesis failed.' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

