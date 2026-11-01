-- ==============================================================================
-- SANKALP — Flashcard Decks & Review Enhancements Migration
-- ==============================================================================

-- 1. Create Flashcard Decks Table
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON public.flashcard_decks(user_id, updated_at DESC);

-- 2. Add Deck Reference to Flashcards if not present
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON public.flashcards(deck_id);

-- 3. Enhance Flashcard Reviews Table
ALTER TABLE public.flashcard_reviews ADD COLUMN IF NOT EXISTS flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE;
ALTER TABLE public.flashcard_reviews ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('known', 'revision'));

-- Backfill card_id / flashcard_id if one is populated
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcard_reviews' AND column_name = 'card_id') THEN
        UPDATE public.flashcard_reviews SET flashcard_id = card_id WHERE flashcard_id IS NULL AND card_id IS NOT NULL;
    END IF;
END $$;

-- Add Unique Constraint on (user_id, card_id) for one active review status per card
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_card_review 
    ON public.flashcard_reviews (user_id, card_id);

-- 4. Row Level Security Policies
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- Decks Policies
DROP POLICY IF EXISTS "Users can view their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can view their own decks" ON public.flashcard_decks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can insert their own decks" ON public.flashcard_decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can update their own decks" ON public.flashcard_decks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can delete their own decks" ON public.flashcard_decks
    FOR DELETE USING (auth.uid() = user_id);

-- Flashcard Reviews Update & Delete Policies (Fixing missing RLS from initial schema)
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can view their own reviews" ON public.flashcard_reviews
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can insert their own reviews" ON public.flashcard_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can update their own reviews" ON public.flashcard_reviews
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.flashcard_reviews
    FOR DELETE USING (auth.uid() = user_id);

