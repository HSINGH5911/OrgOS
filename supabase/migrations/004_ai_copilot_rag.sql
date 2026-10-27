-- ==============================================================================
-- Migration: 004_ai_copilot_rag.sql
-- Description: pgvector extension, document_chunks table, and RBAC vector search
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ensure documents table exists with visibility & indexing columns
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    uploader_name TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    summary TEXT,
    visibility TEXT NOT NULL DEFAULT 'all', -- 'all', 'officers', 'exec', 'president'
    is_indexed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add columns safely if documents table already existed without them
ALTER TABLE documents ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'all';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN NOT NULL DEFAULT false;

-- 3. Document Chunks Table (768 dimensions for Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Indexes for Fast Multi-Tenant Vector Search
CREATE INDEX IF NOT EXISTS idx_document_chunks_org_id ON document_chunks(org_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id);

-- HNSW index works on empty tables and has fast query speed
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. Copilot Chat History Tables
CREATE TABLE IF NOT EXISTS copilot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS copilot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. RPC Function: RBAC-Aware Vector Similarity Search
CREATE OR REPLACE FUNCTION match_org_document_chunks (
    query_embedding VECTOR(768),
    filter_org_id UUID,
    allowed_visibilities TEXT[],
    match_threshold FLOAT DEFAULT 0.30,
    match_count INT DEFAULT 6
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    document_title TEXT,
    document_category TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS chunk_id,
        dc.document_id,
        d.title AS document_title,
        d.category AS document_category,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    INNER JOIN documents d ON d.id = dc.document_id
    WHERE (filter_org_id IS NULL OR dc.org_id = filter_org_id OR d.org_id = filter_org_id)
      AND (
          COALESCE(
              (regexp_match(d.summary, '^\[access:(all|officers|exec|president)\]', 'i'))[1],
              d.visibility,
              'all'
          ) = ANY(allowed_visibilities)
      )
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
