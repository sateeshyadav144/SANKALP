-- ==============================================================================
-- SANKALP — Text-to-Speech Saved Audio & Notes Migration
-- Version: 20261101000001
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.saved_speech_notes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    language_code TEXT NOT NULL,
    language_name TEXT NOT NULL,
    voice_name TEXT NOT NULL,
    voice_gender TEXT NOT NULL DEFAULT 'unspecified',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_speech_notes_user ON public.saved_speech_notes(user_id, created_at DESC);

ALTER TABLE public.saved_speech_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can access their own saved speech notes" ON public.saved_speech_notes;
CREATE POLICY "Students can access their own saved speech notes"
    ON public.saved_speech_notes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

