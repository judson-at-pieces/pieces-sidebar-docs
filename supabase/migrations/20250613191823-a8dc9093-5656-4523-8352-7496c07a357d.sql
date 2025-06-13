
-- Add publicity field to live_editing_sessions table to track document visibility
ALTER TABLE public.live_editing_sessions 
ADD COLUMN publicity TEXT DEFAULT 'PUBLIC' CHECK (publicity IN ('PUBLIC', 'PRIVATE', 'DRAFT'));

-- Create an index for better query performance
CREATE INDEX idx_live_editing_sessions_publicity ON public.live_editing_sessions(publicity);

-- Add a function to get public documents only
CREATE OR REPLACE FUNCTION public.get_public_documents()
RETURNS TABLE(file_path TEXT, publicity TEXT)
LANGUAGE sql
STABLE
AS $$
  SELECT file_path, publicity
  FROM public.live_editing_sessions
  WHERE publicity = 'PUBLIC'
  AND content IS NOT NULL
  AND content != '';
$$;
