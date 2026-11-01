-- ==============================================================================
-- SANKALP MIGRATION: STUDENT SAFETY & WELFARE MODULE
-- Tables: public.safety_reports
-- Functions: public.track_report_status
-- Security: Row Level Security (RLS) & Strict Reporter Anonymity
-- ==============================================================================

-- 1. Create safety_reports Table
CREATE TABLE IF NOT EXISTS public.safety_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous submissions
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Ragging',
        'Bullying',
        'Harassment Concern',
        'Campus Safety',
        'Infrastructure Problem',
        'Hostel or Classroom Issue',
        'Other'
    )),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN (
        'Submitted',
        'Under Review',
        'Action Taken',
        'Resolved'
    )),
    staff_notes TEXT, -- Confidential internal notes for authorities, never returned to students
    action_summary TEXT, -- Student-visible resolution message
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_safety_reports_user ON public.safety_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_code ON public.safety_reports(report_code);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON public.safety_reports(status);
CREATE INDEX IF NOT EXISTS idx_safety_reports_created ON public.safety_reports(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Submission / Insertion
-- If is_anonymous is TRUE, user_id MUST be NULL (strictly enforces zero identity tracking)
-- If is_anonymous is FALSE, user_id MUST equal auth.uid()
CREATE POLICY "Allow students to insert safety reports" ON public.safety_reports
    FOR INSERT WITH CHECK (
        (is_anonymous = true AND user_id IS NULL) OR
        (is_anonymous = false AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
    );

-- Policy 2: Student History Selection
-- Students can ONLY view their own non-anonymous reports
CREATE POLICY "Students can view their own non-anonymous reports" ON public.safety_reports
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND auth.uid() = user_id AND is_anonymous = false
    );

-- Policy 3: Staff & Service Role Management
-- Admins/Staff or service role have full management access
CREATE POLICY "Staff can view and update all safety reports" ON public.safety_reports
    FOR ALL USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.email LIKE '%admin%' OR profiles.department = 'Administration')
        )
    );

-- 4. Secure Public Tracking RPC Function
-- Allows students to look up an anonymous report status using their unique report_code
-- without exposing student identity, reporter email, or internal staff notes.
CREATE OR REPLACE FUNCTION public.track_report_status(p_report_code TEXT)
RETURNS TABLE (
    id UUID,
    report_code TEXT,
    category TEXT,
    subject TEXT,
    description TEXT,
    status TEXT,
    action_summary TEXT,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        sr.report_code,
        sr.category,
        sr.subject,
        sr.description,
        sr.status,
        sr.action_summary,
        sr.created_at
    FROM public.safety_reports sr
    WHERE UPPER(TRIM(sr.report_code)) = UPPER(TRIM(p_report_code));
END;
$$;

