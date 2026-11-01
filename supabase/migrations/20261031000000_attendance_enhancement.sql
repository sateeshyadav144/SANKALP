-- ==============================================================================
-- SANKALP — Attendance Enhancement Migration
-- Support both standard columns and subject_name / attendance_date conventions
-- ==============================================================================

-- 1. Subjects Table Enhancements
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS subject_code TEXT;

-- Backfill subject_name and subject_code from existing columns if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'name') THEN
        UPDATE public.subjects SET subject_name = name WHERE subject_name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'code') THEN
        UPDATE public.subjects SET subject_code = code WHERE subject_code IS NULL AND code IS NOT NULL;
    END IF;
END $$;

-- 2. Attendance Records Table Enhancements
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS attendance_date DATE;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- Backfill attendance_date from date column if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'date') THEN
        UPDATE public.attendance_records SET attendance_date = date WHERE attendance_date IS NULL;
    END IF;
END $$;

-- Flexible Status Constraint: Allow 'Present', 'Absent', 'present', 'absent'
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_status_check 
    CHECK (status IN ('Present', 'Absent', 'present', 'absent', 'cancelled'));

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_subject_att_date 
    ON public.attendance_records (user_id, subject_id, COALESCE(attendance_date, date));

-- Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date 
    ON public.attendance_records (user_id, COALESCE(attendance_date, date) DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_subject 
    ON public.attendance_records (subject_id);

-- Ensure RLS is active and strict
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;
CREATE POLICY "Users can view their own subjects" ON public.subjects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subjects" ON public.subjects;
CREATE POLICY "Users can insert their own subjects" ON public.subjects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subjects" ON public.subjects;
CREATE POLICY "Users can update their own subjects" ON public.subjects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.subjects;
CREATE POLICY "Users can delete their own subjects" ON public.subjects
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_records;
CREATE POLICY "Users can view their own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance_records;
CREATE POLICY "Users can insert their own attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.subjects s 
            WHERE s.id = attendance_records.subject_id AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance_records;
CREATE POLICY "Users can update their own attendance" ON public.attendance_records
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.subjects s 
            WHERE s.id = attendance_records.subject_id AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own attendance" ON public.attendance_records;
CREATE POLICY "Users can delete their own attendance" ON public.attendance_records
    FOR DELETE USING (auth.uid() = user_id);

