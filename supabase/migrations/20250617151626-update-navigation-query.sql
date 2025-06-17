
-- Update the get_navigation_structure function to include privacy field
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
            'file_path', i.file_path,
            'privacy', COALESCE(i.privacy, 'PUBLIC')
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
$function$
