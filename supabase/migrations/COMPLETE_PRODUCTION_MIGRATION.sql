-- ==============================================================================
-- SANKALP — COMPLETE UNIFIED PRODUCTION DATABASE MIGRATION
-- Run this single script in the Supabase Dashboard SQL Editor.
-- Completely idempotent (safe to run on fresh or existing databases).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    roll_number TEXT,
    department TEXT DEFAULT 'Computer Science & Engineering',
    semester TEXT DEFAULT '6th Semester',
    email TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT 'Passionate learner & innovator at Smart Campus',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_roll ON public.profiles(roll_number);

-- Auto-create profile trigger on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. BUDGETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    monthly_limit NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_month_budget UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);

-- ------------------------------------------------------------------------------
-- 3. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'UPI',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(user_id, category);

-- ------------------------------------------------------------------------------
-- 4. SUBJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    subject_name TEXT,
    subject_code TEXT,
    instructor TEXT,
    target_attendance_percentage NUMERIC(5, 2) DEFAULT 75.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Backfill subject_name and subject_code
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'name') THEN
        UPDATE public.subjects SET subject_name = name WHERE subject_name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'code') THEN
        UPDATE public.subjects SET subject_code = code WHERE subject_code IS NULL AND code IS NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subjects_user ON public.subjects(user_id);

-- ------------------------------------------------------------------------------
-- 5. ATTENDANCE RECORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_date DATE,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'present', 'absent', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Backfill attendance_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'date') THEN
        UPDATE public.attendance_records SET attendance_date = date WHERE attendance_date IS NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_subject_att_date 
    ON public.attendance_records (user_id, subject_id, COALESCE(attendance_date, date));
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date 
    ON public.attendance_records (user_id, COALESCE(attendance_date, date) DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_subject 
    ON public.attendance_records (subject_id);

-- ------------------------------------------------------------------------------
-- 6. NOTES & AI SUMMARIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General',
    content TEXT NOT NULL,
    summary TEXT,
    key_points JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON public.notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON public.notes(user_id, subject);

-- ------------------------------------------------------------------------------
-- 6.5 SOURCE DOCUMENTS & EXTRACTED TOPICS (PDF AI VISUALS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 1,
    storage_path TEXT,
    processing_status TEXT NOT NULL DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'error')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_source_docs_user ON public.source_documents(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.extracted_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.source_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_topic_id UUID REFERENCES public.extracted_topics(id) ON DELETE CASCADE,
    topic_number TEXT DEFAULT '',
    topic_title TEXT NOT NULL,
    subtopics TEXT[] DEFAULT '{}',
    extracted_content TEXT NOT NULL,
    page_references INTEGER[] DEFAULT '{}',
    suggested_diagram_types TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_extracted_topics_doc ON public.extracted_topics(document_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_extracted_topics_user ON public.extracted_topics(user_id);

-- ------------------------------------------------------------------------------
-- 7. DIAGRAMS & VISUALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.extracted_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General',
    topic TEXT,
    diagram_type TEXT NOT NULL DEFAULT 'flowchart',
    mermaid_code TEXT NOT NULL,
    description TEXT,
    page_references TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diagrams_user ON public.diagrams(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagrams_doc ON public.diagrams(document_id);

-- ------------------------------------------------------------------------------
-- 8. FLASHCARD DECKS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 9. FLASHCARDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    times_reviewed INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

CREATE INDEX IF NOT EXISTS idx_flashcards_user_subject ON public.flashcards(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON public.flashcards(deck_id);

-- ------------------------------------------------------------------------------
-- 10. FLASHCARD REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('known', 'revision')),
    rating TEXT CHECK (rating IN ('easy', 'good', 'hard')),
    reviewed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.flashcard_reviews ADD COLUMN IF NOT EXISTS flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE;
ALTER TABLE public.flashcard_reviews ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('known', 'revision'));

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcard_reviews' AND column_name = 'card_id') THEN
        UPDATE public.flashcard_reviews SET flashcard_id = card_id WHERE flashcard_id IS NULL AND card_id IS NOT NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_card_review 
    ON public.flashcard_reviews (user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_card 
    ON public.flashcard_reviews(user_id, card_id);

-- ------------------------------------------------------------------------------
-- 11. CODE SNIPPETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.code_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'javascript',
    code TEXT NOT NULL,
    description TEXT,
    output TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_user ON public.code_snippets(user_id, updated_at DESC);

-- ------------------------------------------------------------------------------
-- 12. SAFETY & WELFARE RESOURCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_institutional BOOLEAN DEFAULT TRUE,
    category TEXT NOT NULL CHECK (category IN ('emergency', 'security', 'medical', 'helpline', 'mental_health', 'personal')),
    title TEXT NOT NULL,
    description TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT,
    hours TEXT DEFAULT '24/7 Available',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safety_user ON public.safety_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_category ON public.safety_resources(category);

-- ------------------------------------------------------------------------------
-- 13. SERVER-SIDE RATE LIMITS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    cost INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_window 
    ON public.rate_limits (user_id, action_type, created_at DESC);

-- ------------------------------------------------------------------------------
-- 14. SAVED SPEECH NOTES TABLE
-- ------------------------------------------------------------------------------
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

-- Rate Limiting Stored Procedure
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

    SELECT COUNT(*), MIN(created_at)
    INTO v_count, v_oldest
    FROM public.rate_limits
    WHERE user_id = v_user_id
      AND action_type = p_action
      AND created_at >= (NOW() - (p_window_seconds || ' seconds')::INTERVAL);

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

    INSERT INTO public.rate_limits (user_id, action_type)
    VALUES (v_user_id, p_action);

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

-- GDPR Atomic Erasure Function
CREATE OR REPLACE FUNCTION public.delete_student_account_data()
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to delete account data.';
    END IF;

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

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES — COMPREHENSIVE LOCKDOWN
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_speech_notes ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- 3. Expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- 4. Subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;
CREATE POLICY "Users can view their own subjects" ON public.subjects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subjects" ON public.subjects;
CREATE POLICY "Users can insert their own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subjects" ON public.subjects;
CREATE POLICY "Users can update their own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.subjects;
CREATE POLICY "Users can delete their own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- 5. Attendance Records
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_records;
CREATE POLICY "Users can view their own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance_records;
CREATE POLICY "Users can insert their own attendance" ON public.attendance_records 
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = attendance_records.subject_id AND s.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance_records;
CREATE POLICY "Users can update their own attendance" ON public.attendance_records 
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = attendance_records.subject_id AND s.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own attendance" ON public.attendance_records;
CREATE POLICY "Users can delete their own attendance" ON public.attendance_records FOR DELETE USING (auth.uid() = user_id);

-- 6. Notes
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
CREATE POLICY "Users can insert their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- 6.5 Source Documents & Extracted Topics
DROP POLICY IF EXISTS "Students can only access own source documents" ON public.source_documents;
CREATE POLICY "Students can only access own source documents"
    ON public.source_documents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can only access own extracted topics" ON public.extracted_topics;
CREATE POLICY "Students can only access own extracted topics"
    ON public.extracted_topics
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Diagrams
DROP POLICY IF EXISTS "Users can view their own diagrams" ON public.diagrams;
CREATE POLICY "Users can view their own diagrams" ON public.diagrams FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own diagrams" ON public.diagrams;
CREATE POLICY "Users can insert their own diagrams" ON public.diagrams FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own diagrams" ON public.diagrams;
CREATE POLICY "Users can update their own diagrams" ON public.diagrams FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own diagrams" ON public.diagrams;
CREATE POLICY "Users can delete their own diagrams" ON public.diagrams FOR DELETE USING (auth.uid() = user_id);

-- 8. Flashcard Decks
DROP POLICY IF EXISTS "Users can view their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can view their own decks" ON public.flashcard_decks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can insert their own decks" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can update their own decks" ON public.flashcard_decks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own decks" ON public.flashcard_decks;
CREATE POLICY "Users can delete their own decks" ON public.flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- 9. Flashcards
DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.flashcards;
CREATE POLICY "Users can view their own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flashcards" ON public.flashcards;
CREATE POLICY "Users can insert their own flashcards" ON public.flashcards 
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (deck_id IS NULL OR EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.flashcards;
CREATE POLICY "Users can update their own flashcards" ON public.flashcards 
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id 
        AND (deck_id IS NULL OR EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()))
    );

DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.flashcards;
CREATE POLICY "Users can delete their own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- 10. Flashcard Reviews
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can view their own reviews" ON public.flashcard_reviews FOR SELECT USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.flashcard_reviews FOR DELETE USING (auth.uid() = user_id);

-- 11. Code Snippets
DROP POLICY IF EXISTS "Users can view their own snippets" ON public.code_snippets;
CREATE POLICY "Users can view their own snippets" ON public.code_snippets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own snippets" ON public.code_snippets;
CREATE POLICY "Users can insert their own snippets" ON public.code_snippets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own snippets" ON public.code_snippets;
CREATE POLICY "Users can update their own snippets" ON public.code_snippets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own snippets" ON public.code_snippets;
CREATE POLICY "Users can delete their own snippets" ON public.code_snippets FOR DELETE USING (auth.uid() = user_id);

-- 12. Safety Resources
DROP POLICY IF EXISTS "Anyone can view institutional safety resources" ON public.safety_resources;
CREATE POLICY "Anyone can view institutional safety resources" ON public.safety_resources 
    FOR SELECT USING (is_institutional = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own personal safety contacts" ON public.safety_resources;
CREATE POLICY "Users can insert their own personal safety contacts" ON public.safety_resources 
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_institutional = FALSE);

DROP POLICY IF EXISTS "Users can update their own personal safety contacts" ON public.safety_resources;
CREATE POLICY "Users can update their own personal safety contacts" ON public.safety_resources 
    FOR UPDATE USING (auth.uid() = user_id AND is_institutional = FALSE)
    WITH CHECK (auth.uid() = user_id AND is_institutional = FALSE);

DROP POLICY IF EXISTS "Users can delete their own personal safety contacts" ON public.safety_resources;
CREATE POLICY "Users can delete their own personal safety contacts" ON public.safety_resources 
    FOR DELETE USING (auth.uid() = user_id AND is_institutional = FALSE);

-- 13. Rate Limits
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
CREATE POLICY "Users can view their own rate limits" ON public.rate_limits FOR SELECT USING (auth.uid() = user_id);

-- 14. Saved Speech Notes
DROP POLICY IF EXISTS "Students can access their own saved speech notes" ON public.saved_speech_notes;
CREATE POLICY "Students can access their own saved speech notes"
    ON public.saved_speech_notes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 15. PRIVATE STORAGE BUCKET FOR STUDENT DOCUMENTS (student-vault)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'student-vault',
            'student-vault',
            false,
            10485760, -- 10MB limit
            ARRAY['application/pdf']::text[]
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 10485760;
    END IF;
END $$;

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
-- 16. SEED INSTITUTIONAL SAFETY CONTACTS
-- ------------------------------------------------------------------------------
INSERT INTO public.safety_resources (is_institutional, category, title, description, phone, email, location, hours, is_verified)
VALUES
    (TRUE, 'emergency', 'National Emergency Unified Hotline', 'Central emergency services (Police, Fire, Ambulance)', '112', 'emergency@gov.in', 'Nationwide', '24/7 Available', TRUE),
    (TRUE, 'emergency', 'Campus Security Control Room', 'Central campus surveillance, main security gate, and rapid response team', '+91 98765 43210', 'security@campus.edu', 'Main Gate Security HQ, Block A', '24/7 Available', TRUE),
    (TRUE, 'medical', 'Campus Health Center & Ambulance', 'On-campus primary healthcare, emergency doctor on duty, and campus ambulance service', '+91 98765 43211', 'healthcenter@campus.edu', 'Student Amenity Center, Ground Floor', '24/7 Available', TRUE),
    (TRUE, 'mental_health', 'Student Counseling & Psychological Support', 'Confidential mental health counselors, stress management & crisis intervention', '+91 98765 43212', 'counseling@campus.edu', 'Counseling Wing, Faculty Block 3', 'Mon-Sat: 9:00 AM - 7:00 PM', TRUE),
    (TRUE, 'helpline', 'National Anti-Ragging Helpline', 'UGC 24x7 toll-free anti-ragging helpline for student safety', '1800-180-5522', 'helpline@antiragging.in', 'National Headquarters', '24/7 Toll Free', TRUE),
    (TRUE, 'helpline', 'Women Safety & Harassment Cell', 'Internal Complaints Committee (ICC) & 24/7 women safety assistance', '+91 98765 43213', 'womencell@campus.edu', 'Administrative Block, Room 104', '24/7 Available', TRUE)
ON CONFLICT DO NOTHING;

