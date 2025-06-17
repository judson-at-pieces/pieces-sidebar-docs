
-- Add privacy column to navigation_items table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'navigation_items' AND column_name = 'privacy') THEN
        ALTER TABLE public.navigation_items ADD COLUMN privacy TEXT DEFAULT 'PUBLIC' CHECK (privacy IN ('PUBLIC', 'PRIVATE'));
    END IF;
END $$;

-- Update existing records to have PUBLIC privacy by default
UPDATE public.navigation_items SET privacy = 'PUBLIC' WHERE privacy IS NULL;
