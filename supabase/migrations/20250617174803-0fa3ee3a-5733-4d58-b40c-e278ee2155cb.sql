
-- Create a function to update privacy settings cascadingly for folders and their contents
CREATE OR REPLACE FUNCTION public.update_navigation_item_privacy_cascade(
  p_file_path text, 
  p_privacy text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the specific item
  UPDATE public.navigation_items 
  SET privacy = p_privacy, updated_at = NOW()
  WHERE file_path = p_file_path;
  
  -- If this is a folder (directory), update all items that start with this path
  IF p_file_path LIKE '%/' OR EXISTS (
    SELECT 1 FROM public.navigation_items 
    WHERE file_path LIKE p_file_path || '/%'
  ) THEN
    -- Update all child items (files and subdirectories within this folder)
    UPDATE public.navigation_items 
    SET privacy = p_privacy, updated_at = NOW()
    WHERE file_path LIKE p_file_path || '/%'
    OR file_path LIKE RTRIM(p_file_path, '/') || '/%';
    
    -- Also update the corresponding .md file if it exists (e.g., /cli/copilot.md for /cli/copilot/)
    UPDATE public.navigation_items 
    SET privacy = p_privacy, updated_at = NOW()
    WHERE file_path = RTRIM(p_file_path, '/') || '.md';
  END IF;
  
  -- If this is a .md file, also update the corresponding folder if it exists
  IF p_file_path LIKE '%.md' THEN
    UPDATE public.navigation_items 
    SET privacy = p_privacy, updated_at = NOW()
    WHERE file_path = REPLACE(p_file_path, '.md', '/') 
    OR file_path = REPLACE(p_file_path, '.md', '');
  END IF;
END;
$function$;

-- Update the existing function to use the new cascading function
CREATE OR REPLACE FUNCTION public.update_navigation_item_privacy_by_file_path_cascade(
  p_file_path text, 
  p_privacy text
)
RETURNS TABLE(updated_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  affected_rows bigint;
BEGIN
  -- Use the cascade function
  PERFORM public.update_navigation_item_privacy_cascade(p_file_path, p_privacy);
  
  -- Count how many rows were affected
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN QUERY SELECT affected_rows;
END;
$function$;
