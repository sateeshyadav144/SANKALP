-- ==============================================================================
-- SANKALP — Smart Campus Ecosystem Database Schema & RLS Policies
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
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

-- Index on profiles
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

-- ==============================================================================
-- 2. BUDGETS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 3. EXPENSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL, -- 'Food & Canteen', 'Books & Stationery', 'Travel & Transit', 'Hostel & Rent', 'Utilities', 'Entertainment', 'Others'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'UPI', -- 'UPI', 'Cash', 'Card', 'Net Banking'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(user_id, category);

-- ==============================================================================
-- 4. SUBJECTS TABLE (For Attendance Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    instructor TEXT,
    target_attendance_percentage NUMERIC(5, 2) DEFAULT 75.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_user ON public.subjects(user_id);

-- ==============================================================================
-- 5. ATTENDANCE RECORDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_subject_date_attendance UNIQUE (user_id, subject_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_subject ON public.attendance_records(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(user_id, date DESC);

-- ==============================================================================
-- 6. NOTES & SUMMARIES TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 7. DIAGRAMS & VISUALS TABLE (Mermaid Diagrams)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General',
    topic TEXT,
    diagram_type TEXT NOT NULL DEFAULT 'flowchart', -- 'flowchart', 'sequence', 'classDiagram', 'stateDiagram', 'mindmap', 'gantt'
    mermaid_code TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diagrams_user ON public.diagrams(user_id, updated_at DESC);

-- ==============================================================================
-- 8. FLASHCARDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    times_reviewed INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_subject ON public.flashcards(user_id, subject);

-- Flashcard Reviews History
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK (rating IN ('easy', 'good', 'hard')),
    reviewed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_card ON public.flashcard_reviews(user_id, card_id);

-- ==============================================================================
-- 9. CODE SNIPPETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.code_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'javascript', -- 'javascript', 'typescript', 'python', 'html', 'c', 'cpp'
    code TEXT NOT NULL,
    description TEXT,
    output TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_user ON public.code_snippets(user_id, updated_at DESC);

-- ==============================================================================
-- 10. SAFETY & WELFARE RESOURCES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.safety_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means official institutional resource, non-null means student's personal trusted contact
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subjects" ON public.subjects
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subjects" ON public.subjects
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subjects" ON public.subjects
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subjects" ON public.subjects
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Attendance Records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attendance" ON public.attendance_records
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own attendance" ON public.attendance_records
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Diagrams
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own diagrams" ON public.diagrams
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own diagrams" ON public.diagrams
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own diagrams" ON public.diagrams
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diagrams" ON public.diagrams
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Flashcards & Reviews
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own flashcards" ON public.flashcards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON public.flashcards
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON public.flashcards
    FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reviews" ON public.flashcard_reviews
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reviews" ON public.flashcard_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Code Snippets
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own snippets" ON public.code_snippets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snippets" ON public.code_snippets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own snippets" ON public.code_snippets
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own snippets" ON public.code_snippets
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Safety Resources (Institutional are publicly readable, Personal are user-scoped)
ALTER TABLE public.safety_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view institutional safety resources" ON public.safety_resources
    FOR SELECT USING (is_institutional = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own personal safety contacts" ON public.safety_resources
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_institutional = FALSE);
CREATE POLICY "Users can update their own personal safety contacts" ON public.safety_resources
    FOR UPDATE USING (auth.uid() = user_id AND is_institutional = FALSE);
CREATE POLICY "Users can delete their own personal safety contacts" ON public.safety_resources
    FOR DELETE USING (auth.uid() = user_id AND is_institutional = FALSE);

-- ==============================================================================
-- DEFAULT SEED DATA FOR INSTITUTIONAL SAFETY & WELFARE
-- ==============================================================================
INSERT INTO public.safety_resources (is_institutional, category, title, description, phone, email, location, hours, is_verified)
VALUES
    (TRUE, 'emergency', 'National Emergency Unified Hotline', 'Central emergency services (Police, Fire, Ambulance)', '112', 'emergency@gov.in', 'Nationwide', '24/7 Available', TRUE),
    (TRUE, 'emergency', 'Campus Security Control Room', 'Central campus surveillance, main security gate, and rapid response team', '+91 98765 43210', 'security@campus.edu', 'Main Gate Security HQ, Block A', '24/7 Available', TRUE),
    (TRUE, 'medical', 'Campus Health Center & Ambulance', 'On-campus primary healthcare, emergency doctor on duty, and campus ambulance service', '+91 98765 43211', 'healthcenter@campus.edu', 'Student Amenity Center, Ground Floor', '24/7 Available', TRUE),
    (TRUE, 'mental_health', 'Student Counseling & Psychological Support', 'Confidential mental health counselors, stress management & crisis intervention', '+91 98765 43212', 'counseling@campus.edu', 'Counseling Wing, Faculty Block 3', 'Mon-Sat: 9:00 AM - 7:00 PM', TRUE),
    (TRUE, 'helpline', 'National Anti-Ragging Helpline', 'UGC 24x7 toll-free anti-ragging helpline for student safety', '1800-180-5522', 'helpline@antiragging.in', 'National Headquarters', '24/7 Toll Free', TRUE),
    (TRUE, 'helpline', 'Women Safety & Harassment Cell', 'Internal Complaints Committee (ICC) & 24/7 women safety assistance', '+91 98765 43213', 'womencell@campus.edu', 'Administrative Block, Room 104', '24/7 Available', TRUE)
ON CONFLICT DO NOTHING;
