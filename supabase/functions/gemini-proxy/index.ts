// ==============================================================================
// SANKALP — Secure Server-Side Gemini Proxy & Rate Limiter
// Supabase Edge Function (Deno Runtime)
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify User Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: GEMINI_API_KEY is not configured on the backend.',
          fallback_required: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired student session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse and Validate Request Payload
    const body = await req.json();
    const { actionType = 'ai_notes', contents, generationConfig } = body;

    // Check payload size (10 MB limit)
    const payloadStr = JSON.stringify(body);
    if (payloadStr.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Payload exceeds maximum allowed limit of 10MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Server-Side Database-Backed Rate Limiting
    const maxRequests = actionType === 'ai_flashcards' ? 5 : 10;
    const windowSeconds = 3600; // 1 hour

    const { data: rateCheck, error: rpcError } = await supabase.rpc(
      'check_and_consume_rate_limit',
      {
        p_action: actionType,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
      }
    );

    if (rpcError) {
      console.warn('Rate limit RPC warning:', rpcError);
    } else if (rateCheck && rateCheck.allowed === false) {
      return new Response(
        JSON.stringify({
          error: rateCheck.error || 'Rate limit exceeded.',
          reset_seconds: rateCheck.reset_seconds,
          current_usage: rateCheck.current_usage,
          max_allowed: rateCheck.max_allowed,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Secure Backend Request to Google Gemini API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini upstream error:', geminiResponse.status, errText);
      return new Response(
        JSON.stringify({
          error: `Upstream AI service error (${geminiResponse.status}).`,
          fallback_required: true,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    return new Response(JSON.stringify(geminiData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Edge function internal error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal proxy error.', fallback_required: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

