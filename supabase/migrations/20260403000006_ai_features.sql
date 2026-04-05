-- ============================================================================
-- AI Features: Semantic Search (pgvector), Ticket Analysis
-- ============================================================================

-- Enable pgvector extension (Supabase has it built-in)
CREATE EXTENSION IF NOT EXISTS vector;

-- Article embeddings for semantic search
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Ticket sentiment
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'angry'));
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sentiment_score numeric(3,2); -- -1.0 to 1.0
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS ai_draft_reply text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS ai_suggested_articles uuid[];

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_kb_articles_embedding ON kb_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Similarity search function
CREATE OR REPLACE FUNCTION search_kb_articles(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM kb_articles a
  WHERE a.status = 'published'
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- OpenAI API Key system setting
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('openai_api_key', '', 'text', 'ai', 'OpenAI API Key')
ON CONFLICT (setting_key) DO NOTHING;
