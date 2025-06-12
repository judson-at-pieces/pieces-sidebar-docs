
-- Fix search_path security warnings for all database functions
-- This prevents potential security issues by fixing the search path

-- Update acquire_file_lock function
CREATE OR REPLACE FUNCTION public.acquire_file_lock(p_file_path text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_lock_user UUID;
  lock_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if file is already locked by someone else
  SELECT locked_by, locked_at INTO current_lock_user, lock_timestamp
  FROM public.live_editing_sessions
  WHERE file_path = p_file_path
  AND locked_by IS NOT NULL
  AND locked_at > NOW() - INTERVAL '30 minutes'; -- Auto-release locks after 30 minutes of inactivity
  
  -- If locked by someone else, return false
  IF current_lock_user IS NOT NULL AND current_lock_user != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Acquire or refresh the lock
  INSERT INTO public.live_editing_sessions (file_path, content, user_id, locked_by, locked_at)
  VALUES (p_file_path, '', p_user_id, p_user_id, NOW())
  ON CONFLICT (file_path) 
  DO UPDATE SET 
    locked_by = p_user_id,
    locked_at = NOW(),
    updated_at = NOW();
    
  RETURN TRUE;
END;
$function$;

-- Update release_file_lock function
CREATE OR REPLACE FUNCTION public.release_file_lock(p_file_path text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.live_editing_sessions
  SET locked_by = NULL, locked_at = NULL, updated_at = NOW()
  WHERE file_path = p_file_path 
  AND locked_by = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Update save_live_content function
CREATE OR REPLACE FUNCTION public.save_live_content(p_file_path text, p_content text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow saving if user has the lock
  UPDATE public.live_editing_sessions
  SET content = p_content, updated_at = NOW(), locked_at = NOW()
  WHERE file_path = p_file_path 
  AND locked_by = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Update get_live_editing_sessions function
CREATE OR REPLACE FUNCTION public.get_live_editing_sessions()
 RETURNS TABLE(file_path text, content text, locked_by_email text, locked_by_name text, locked_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
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
  WHERE les.locked_by IS NOT NULL;
$function$;

-- Update get_current_github_config function
CREATE OR REPLACE FUNCTION public.get_current_github_config()
 RETURNS TABLE(repo_owner text, repo_name text, installation_id integer)
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT repo_owner, repo_name, installation_id
  FROM public.github_config
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update generate_admin_access_code function
CREATE OR REPLACE FUNCTION public.generate_admin_access_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Generate random 8-character code
  new_code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Insert new code
  INSERT INTO public.admin_access_codes (code) VALUES (new_code);
  
  RETURN new_code;
END;
$function$;

-- Update get_live_editing_sessions_by_branch function
CREATE OR REPLACE FUNCTION public.get_live_editing_sessions_by_branch(branch_name text)
 RETURNS TABLE(file_path text, content text, locked_by_email text, locked_by_name text, locked_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
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

-- Update acquire_file_lock_by_branch function
CREATE OR REPLACE FUNCTION public.acquire_file_lock_by_branch(p_file_path text, p_user_id uuid, p_branch_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Update release_file_lock_by_branch function
CREATE OR REPLACE FUNCTION public.release_file_lock_by_branch(p_file_path text, p_user_id uuid, p_branch_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Update save_live_content_by_branch function
CREATE OR REPLACE FUNCTION public.save_live_content_by_branch(p_file_path text, p_content text, p_user_id uuid, p_branch_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Update get_navigation_structure function
CREATE OR REPLACE FUNCTION public.get_navigation_structure()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH sections_with_items AS (
    SELECT 
      s.id,
      s.title,
      s.slug,
      s.description,
      s.icon,
      s.order_index,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'title', i.title,
            'href', i.href,
            'description', i.description,
            'icon', i.icon,
            'order_index', i.order_index,
            'parent_id', i.parent_id,
            'is_auto_generated', i.is_auto_generated,
            'file_path', i.file_path
          ) ORDER BY i.order_index, i.title
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) as items
    FROM public.navigation_sections s
    LEFT JOIN public.navigation_items i ON s.id = i.section_id AND i.is_active = true
    WHERE s.is_active = true
    GROUP BY s.id, s.title, s.slug, s.description, s.icon, s.order_index
  )
  SELECT json_build_object(
    'sections', json_agg(
      json_build_object(
        'id', id,
        'title', title,
        'slug', slug,
        'description', description,
        'icon', icon,
        'order_index', order_index,
        'items', items
      ) ORDER BY order_index, title
    )
  )::jsonb
  FROM sections_with_items;
$function$;

-- Update sync_navigation_from_content function
CREATE OR REPLACE FUNCTION public.sync_navigation_from_content()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  content_paths TEXT[];
  path_record RECORD;
  section_record RECORD;
  section_id UUID;
  parent_item_id UUID;
  path_parts TEXT[];
  current_path TEXT;
  item_title TEXT;
BEGIN
  -- This will be called by your content sync process
  -- For now, we'll create the basic structure
  
  -- Insert default sections if they don't exist
  INSERT INTO public.navigation_sections (title, slug, order_index) VALUES
    ('Meet Pieces', 'meet-pieces', 1),
    ('Quick Guides', 'quick-guides', 2),
    ('Desktop', 'desktop', 3),
    ('Core Dependencies', 'core-dependencies', 4),
    ('MCP', 'mcp', 5),
    ('Extensions & Plugins', 'extensions-plugins', 6),
    ('Productivity', 'productivity', 7),
    ('Large Language Models', 'large-language-models', 8),
    ('Web Extension', 'web-extension', 9),
    ('CLI', 'cli', 10),
    ('Obsidian', 'obsidian', 11)
  ON CONFLICT (slug) DO NOTHING;
  
  RETURN 'Navigation sync completed';
END;
$function$;

-- Update use_admin_access_code function
CREATE OR REPLACE FUNCTION public.use_admin_access_code(access_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code_record RECORD;
  current_user_id UUID;
BEGIN
  -- Get the current user ID (might be null if not authenticated)
  current_user_id := auth.uid();
  
  -- Find valid code
  SELECT * INTO code_record 
  FROM public.admin_access_codes 
  WHERE code = access_code 
    AND is_active = true 
    AND expires_at > now() 
    AND used_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark code as used (even if user_id is null for now)
  UPDATE public.admin_access_codes 
  SET used_by = current_user_id, used_at = now()
  WHERE id = code_record.id;
  
  -- Only try to grant role if user is authenticated
  IF current_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'editor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN TRUE;
END;
$function$;
