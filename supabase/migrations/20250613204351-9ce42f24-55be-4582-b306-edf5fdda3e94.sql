
-- Create analytics tables for tracking page views and references
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance on common queries
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);

-- Create table for tracking external references to documentation
CREATE TABLE public.page_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  referrer_domain TEXT NOT NULL,
  referrer_url TEXT,
  count INTEGER DEFAULT 1,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate referrer entries
CREATE UNIQUE INDEX idx_page_references_unique ON public.page_references(page_path, referrer_domain);

-- Create table for tracking search queries within the documentation
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for search analytics
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at);

-- Enable RLS on analytics tables
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for page_views (admins can see all, users can see their own)
CREATE POLICY "Admins can view all page views" 
  ON public.page_views 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own page views" 
  ON public.page_views 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert page views" 
  ON public.page_views 
  FOR INSERT 
  WITH CHECK (true);

-- RLS policies for page_references (admins only)
CREATE POLICY "Admins can view all page references" 
  ON public.page_references 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for search_analytics (admins can see all, users can see their own)
CREATE POLICY "Admins can view all search analytics" 
  ON public.search_analytics 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own search analytics" 
  ON public.search_analytics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert search analytics" 
  ON public.search_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to get popular pages analytics
CREATE OR REPLACE FUNCTION public.get_popular_pages(days_back INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  page_path TEXT,
  view_count BIGINT,
  unique_visitors BIGINT,
  avg_daily_views NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pv.page_path,
    COUNT(*) as view_count,
    COUNT(DISTINCT COALESCE(pv.user_id::text, pv.session_id)) as unique_visitors,
    ROUND(COUNT(*)::numeric / GREATEST(days_back, 1), 2) as avg_daily_views
  FROM public.page_views pv
  WHERE pv.created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY pv.page_path
  ORDER BY view_count DESC
  LIMIT limit_count;
$$;

-- Create function to get referrer analytics
CREATE OR REPLACE FUNCTION public.get_top_referrers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  referrer_domain TEXT,
  total_references BIGINT,
  unique_pages BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pr.referrer_domain,
    SUM(pr.count) as total_references,
    COUNT(DISTINCT pr.page_path) as unique_pages,
    MAX(pr.last_seen) as last_activity
  FROM public.page_references pr
  GROUP BY pr.referrer_domain
  ORDER BY total_references DESC
  LIMIT limit_count;
$$;

-- Create function to get search analytics
CREATE OR REPLACE FUNCTION public.get_search_analytics(days_back INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  avg_results NUMERIC,
  last_searched TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sa.query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count), 1) as avg_results,
    MAX(sa.created_at) as last_searched
  FROM public.search_analytics sa
  WHERE sa.created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY sa.query
  ORDER BY search_count DESC
  LIMIT limit_count;
$$;
