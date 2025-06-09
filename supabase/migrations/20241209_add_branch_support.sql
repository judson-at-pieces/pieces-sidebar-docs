
-- Add branch_name column to live_editing_sessions table
ALTER TABLE public.live_editing_sessions 
ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT 'main';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_live_editing_sessions_branch_file 
ON public.live_editing_sessions(branch_name, file_path);

-- Update the constraint to include branch_name for uniqueness per branch
DROP INDEX IF EXISTS live_editing_sessions_file_path_key;
CREATE UNIQUE INDEX live_editing_sessions_branch_file_unique 
ON public.live_editing_sessions(file_path, branch_name);

-- Create function to get live editing sessions by branch
CREATE OR REPLACE FUNCTION public.get_live_editing_sessions_by_branch(branch_name text)
RETURNS TABLE(file_path text, content text, locked_by_email text, locked_by_name text, locked_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE
AS $function$
  SELECT 
    les.file_path,
    les.content,
    p.email as locked_by_email,
    p.full_name as locked_by_name,
    les.locked_at,
    les.updated_at
  FROM public.live_editing_sessions les
  LEFT JOIN public.profiles p ON les.locked_by = p.id
  WHERE les.branch_name = $1 AND les.locked_by IS NOT NULL;
$function$;

-- Create function to acquire file lock by branch
CREATE OR REPLACE FUNCTION public.acquire_file_lock_by_branch(p_file_path text, p_user_id uuid, p_branch_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_lock_user UUID;
  lock_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if file is already locked by someone else on this branch
  SELECT locked_by, locked_at INTO current_lock_user, lock_timestamp
  FROM public.live_editing_sessions
  WHERE file_path = p_file_path
  AND branch_name = p_branch_name
  AND locked_by IS NOT NULL
  AND locked_at > NOW() - INTERVAL '30 minutes'; -- Auto-release locks after 30 minutes of inactivity
  
  -- If locked by someone else, return false
  IF current_lock_user IS NOT NULL AND current_lock_user != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Acquire or refresh the lock
  INSERT INTO public.live_editing_sessions (file_path, content, user_id, locked_by, locked_at, branch_name)
  VALUES (p_file_path, '', p_user_id, p_user_id, NOW(), p_branch_name)
  ON CONFLICT (file_path, branch_name) 
  DO UPDATE SET 
    locked_by = p_user_id,
    locked_at = NOW(),
    updated_at = NOW();
    
  RETURN TRUE;
END;
$function$;

-- Create function to release file lock by branch
CREATE OR REPLACE FUNCTION public.release_file_lock_by_branch(p_file_path text, p_user_id uuid, p_branch_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.live_editing_sessions
  SET locked_by = NULL, locked_at = NULL, updated_at = NOW()
  WHERE file_path = p_file_path 
  AND branch_name = p_branch_name
  AND locked_by = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Create function to save live content by branch
CREATE OR REPLACE FUNCTION public.save_live_content_by_branch(p_file_path text, p_content text, p_user_id uuid, p_branch_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only allow saving if user has the lock on this branch
  UPDATE public.live_editing_sessions
  SET content = p_content, updated_at = NOW(), locked_at = NOW()
  WHERE file_path = p_file_path 
  AND branch_name = p_branch_name
  AND locked_by = p_user_id;
  
  RETURN FOUND;
END;
$function$;
