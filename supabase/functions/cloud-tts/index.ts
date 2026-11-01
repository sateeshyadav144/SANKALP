// ==============================================================================
// SANKALP — Secure Server-Side Multilingual Cloud TTS Proxy
// Supabase Edge Function (Deno Runtime)
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Verified Cloud TTS Supported ISO codes
const SUPPORTED_CLOUD_ISOS = new Set([
  'hi', 'en-IN', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur', 'ne'
]);

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // Validate request body
    const body = await req.json();
    const { text, languageCode = 'hi-IN', iso = 'hi' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Text content is required for speech synthesis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text length exceeds maximum allowed limit of 5,000 characters.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetIso = (iso || languageCode.split('-')[0]).toLowerCase();
    const normalizedIso = targetIso === 'en' ? 'en-IN' : targetIso;

    if (!SUPPORTED_CLOUD_ISOS.has(normalizedIso)) {
      return new Response(
        JSON.stringify({
          error: `Language '${languageCode}' is not currently available via Cloud TTS. Please install a local Windows voice pack or choose Hindi/English.`,
          unsupported: true,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional user authentication check if Supabase is connected
    if (authHeader && supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check rate limit: 20 speech generations per hour
          await supabase.rpc('check_and_consume_rate_limit', {
            p_action: 'cloud_tts',
            p_max_requests: 20,
            p_window_seconds: 3600,
          });
        }
      } catch (authErr) {
        console.warn('Session verification skipped or failed:', authErr);
      }
    }

    // Split text into safe chunks and fetch MP3 bytes
    const chunks = splitIntoChunks(text);
    const audioBuffers: Uint8Array[] = [];

    for (const chunk of chunks) {
      const encoded = encodeURIComponent(chunk);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${normalizedIso}&client=tw-ob`;

      const resp = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!resp.ok) {
        throw new Error(`Cloud TTS upstream responded with HTTP ${resp.status}`);
      }

      const arrBuf = await resp.arrayBuffer();
      audioBuffers.push(new Uint8Array(arrBuf));
    }

    // Calculate total buffer length
    const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    return new Response(combined, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': combined.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    console.error('Cloud TTS generation error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Speech generation failed.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

