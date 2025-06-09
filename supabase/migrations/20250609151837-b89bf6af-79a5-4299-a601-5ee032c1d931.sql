
-- Create table for live typing sessions
CREATE TABLE IF NOT EXISTS public.live_typing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  cursor_position INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_path, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.live_typing_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for live typing sessions
CREATE POLICY "Users can view all live typing sessions for files they have access to" 
  ON public.live_typing_sessions 
  FOR SELECT 
  USING (true); -- Allow viewing all sessions for real-time collaboration

CREATE POLICY "Users can insert their own live typing sessions" 
  ON public.live_typing_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own live typing sessions" 
  ON public.live_typing_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own live typing sessions" 
  ON public.live_typing_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable realtime for the table
ALTER TABLE public.live_typing_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_typing_sessions;
