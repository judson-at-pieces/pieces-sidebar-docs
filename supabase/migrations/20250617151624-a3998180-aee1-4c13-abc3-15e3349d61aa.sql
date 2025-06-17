
-- Add privacy column to navigation_items table
ALTER TABLE public.navigation_items 
ADD COLUMN privacy text DEFAULT 'PUBLIC' CHECK (privacy IN ('PUBLIC', 'PRIVATE'));

-- Update existing rows to have PUBLIC privacy by default
UPDATE public.navigation_items SET privacy = 'PUBLIC' WHERE privacy IS NULL;
