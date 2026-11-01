-- ==============================================================================
-- SANKALP — PDF-Based Topic Extraction & Visuals Database Migration
-- Version: 20261101000000
-- ==============================================================================

-- 1. Source Documents Table
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

-- 2. Extracted Topics Table
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

-- 3. Extend Diagrams Table with document and topic references if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'diagrams' AND column_name = 'document_id'
    ) THEN
        ALTER TABLE public.diagrams ADD COLUMN document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'diagrams' AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE public.diagrams ADD COLUMN topic_id UUID REFERENCES public.extracted_topics(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'diagrams' AND column_name = 'page_references'
    ) THEN
        ALTER TABLE public.diagrams ADD COLUMN page_references TEXT DEFAULT '';
    END IF;
END $$;

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_source_docs_user ON public.source_documents(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_topics_doc ON public.extracted_topics(document_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_extracted_topics_user ON public.extracted_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_doc ON public.diagrams(document_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_topics ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Strict User Isolation (auth.uid() = user_id)
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

