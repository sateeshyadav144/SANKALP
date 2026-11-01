-- ==============================================================================
-- SANKALP — Complete Security Hardening, RLS Lockdown & Rate Limiting Migration
-- Phase 1 to Phase 6 Security Implementation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SERVER-SIDE RATE LIMITING INFRASTRUCTURE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'gemini_ai', 'pdf_processing', 'diagram_gen', 'auth_attempt'
    cost INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Fast composite index for sliding window lookup
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_window 
    ON public.rate_limits (user_id, action_type, created_at DESC);

-- Enable RLS on rate limits: users can only view their own usage history
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
CREATE POLICY "Users can view their own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Check and consume rate limit procedure (SECURITY DEFINER to prevent client tampering)
CREATE OR REPLACE FUNCTION public.check_and_consume_rate_limit(
    p_action TEXT,
    p_max_requests INT DEFAULT 10,
    p_window_seconds INT DEFAULT 3600
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_count INT;
    v_oldest TIMESTAMPTZ;
    v_reset_seconds INT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'status', 401,
            'error', 'Unauthorized: User authentication required.'
        );
    END IF;

    -- Count consumed tokens within the rolling window
    SELECT COUNT(*), MIN(created_at)
    INTO v_count, v_oldest
    FROM public.rate_limits
    WHERE user_id = v_user_id
      AND action_type = p_action
      AND created_at >= (NOW() - (p_window_seconds || ' seconds')::INTERVAL);

    -- If limit reached or exceeded, return HTTP 429 structured payload
    IF v_count >= p_max_requests THEN
        v_reset_seconds := GREATEST(1, EXTRACT(EPOCH FROM (v_oldest + (p_window_seconds || ' seconds')::INTERVAL - NOW()))::INT);
        RETURN jsonb_build_object(
            'allowed', false,
            'status', 429,
            'action', p_action,
            'current_usage', v_count,
            'max_allowed', p_max_requests,
            'reset_seconds', v_reset_seconds,
            'error', 'Rate limit exceeded: You have reached the maximum of ' || p_max_requests || ' ' || p_action || ' requests per window. Please try again in ' || v_reset_seconds || ' seconds.'
        );
    END IF;

    -- Record consumption
    INSERT INTO public.rate_limits (user_id, action_type)
    VALUES (v_user_id, p_action);

    -- Maintenance: Prune entries older than 7 days
    DELETE FROM public.rate_limits
    WHERE created_at < (NOW() - INTERVAL '7 days');

    RETURN jsonb_build_object(
        'allowed', true,
        'status', 200,
        'action', p_action,
        'remaining', p_max_requests - v_count - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. HARDENED ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure every table has strict WITH CHECK (auth.uid() = user_id)
-- ------------------------------------------------------------------------------

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Budgets Table
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Expenses Table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notes Table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Diagrams Table
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own diagrams" ON public.diagrams;
CREATE POLICY "Users can update their own diagrams" ON public.diagrams
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Code Snippets Table
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own snippets" ON public.code_snippets;
CREATE POLICY "Users can update their own snippets" ON public.code_snippets
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Flashcards Table: Enforce Deck Ownership Verification
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own flashcards" ON public.flashcards;
CREATE POLICY "Users can insert their own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            deck_id IS NULL OR 
            EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.flashcards;
CREATE POLICY "Users can update their own flashcards" ON public.flashcards
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (
            deck_id IS NULL OR 
            EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid())
        )
    );

-- Flashcard Reviews Table: Enforce Card Ownership Verification
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can insert their own reviews" ON public.flashcard_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.flashcards f WHERE f.id = flashcard_reviews.card_id AND f.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can update their own reviews" ON public.flashcard_reviews
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.flashcards f WHERE f.id = flashcard_reviews.card_id AND f.user_id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 3. PRIVATE STORAGE BUCKET FOR STUDENT DOCUMENTS (student-vault)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'student-vault',
            'student-vault',
            false,
            10485760, -- 10MB maximum file size limit
            ARRAY['application/pdf']::text[]
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 10485760;
    END IF;
END $$;

-- Storage object policies for student-vault (Folder isolation per user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Students can view their own vault documents" ON storage.objects;
        CREATE POLICY "Students can view their own vault documents" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'student-vault' 
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "Students can upload their own vault documents" ON storage.objects;
        CREATE POLICY "Students can upload their own vault documents" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'student-vault' 
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "Students can update their own vault documents" ON storage.objects;
        CREATE POLICY "Students can update their own vault documents" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'student-vault' 
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "Students can delete their own vault documents" ON storage.objects;
        CREATE POLICY "Students can delete their own vault documents" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'student-vault' 
                AND (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC STUDENT DATA DELETION PROCEDURE (GDPR / Right to be Forgotten)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_student_account_data()
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to delete account data.';
    END IF;

    -- Delete in reverse dependency order
    DELETE FROM public.rate_limits WHERE user_id = v_user_id;
    DELETE FROM public.flashcard_reviews WHERE user_id = v_user_id;
    DELETE FROM public.flashcards WHERE user_id = v_user_id;
    DELETE FROM public.flashcard_decks WHERE user_id = v_user_id;
    DELETE FROM public.code_snippets WHERE user_id = v_user_id;
    DELETE FROM public.diagrams WHERE user_id = v_user_id;
    DELETE FROM public.notes WHERE user_id = v_user_id;
    DELETE FROM public.attendance_records WHERE user_id = v_user_id;
    DELETE FROM public.subjects WHERE user_id = v_user_id;
    DELETE FROM public.expenses WHERE user_id = v_user_id;
    DELETE FROM public.budgets WHERE user_id = v_user_id;
    DELETE FROM public.safety_resources WHERE user_id = v_user_id AND is_institutional = FALSE;
    DELETE FROM public.profiles WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

