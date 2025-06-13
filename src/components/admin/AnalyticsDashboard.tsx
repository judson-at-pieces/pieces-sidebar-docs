
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Search, 
  ExternalLink, 
  RefreshCw,
  Calendar,
  Globe,
  Eye
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PopularPage {
  page_path: string;
  view_count: number;
  unique_visitors: number;
  avg_daily_views: number;
}

interface TopReferrer {
  referrer_domain: string;
  total_references: number;
  unique_pages: number;
  last_activity: string;
}

interface SearchQuery {
  query: string;
  search_count: number;
  avg_results: number;
  last_searched: string;
}

interface AnalyticsStats {
  totalViews: number;
  totalUsers: number;
  totalPages: number;
  totalSearches: number;
}

export function AnalyticsDashboard() {
  const [popularPages, setPopularPages] = useState<PopularPage[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalViews: 0,
    totalUsers: 0,
    totalPages: 0,
    totalSearches: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch popular pages
      const { data: pages, error: pagesError } = await supabase.rpc('get_popular_pages', {
        days_back: parseInt(timeRange),
        limit_count: 15
      });

      if (pagesError) throw pagesError;

      // Fetch top referrers
      const { data: referrers, error: referrersError } = await supabase.rpc('get_top_referrers', {
        limit_count: 10
      });

      if (referrersError) throw referrersError;

      // Fetch search analytics
      const { data: searches, error: searchesError } = await supabase.rpc('get_search_analytics', {
        days_back: parseInt(timeRange),
        limit_count: 15
      });

      if (searchesError) throw searchesError;

      // Fetch overall stats
      await fetchOverallStats();

      setPopularPages(pages || []);
      setTopReferrers(referrers || []);
      setSearchQueries(searches || []);

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
      toast({
        title: "Error",
        description: "Failed to fetch analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      const daysBack = parseInt(timeRange);
      
      // Get total views
      const { count: viewsCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      // Get unique users
      const { data: uniqueUsers } = await supabase
        .from('page_views')
        .select('user_id, session_id')
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      const uniqueVisitors = new Set(
        uniqueUsers?.map(u => u.user_id || u.session_id).filter(Boolean) || []
      ).size;

      // Get unique pages
      const { data: uniquePages } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      const uniquePageCount = new Set(uniquePages?.map(p => p.page_path) || []).size;

      // Get total searches
      const { count: searchCount } = await supabase
        .from('search_analytics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalViews: viewsCount || 0,
        totalUsers: uniqueVisitors,
        totalPages: uniquePageCount,
        totalSearches: searchCount || 0
      });

    } catch (err) {
      console.error('Error fetching overall stats:', err);
    }
  };

  const formatPagePath = (path: string) => {
    return path.replace(/^\//, '').replace(/\//g, ' / ') || 'Home';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Track user engagement and content performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-xl font-bold">{formatNumber(stats.totalViews)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="text-xl font-bold">{formatNumber(stats.totalUsers)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pages Viewed</p>
                <p className="text-xl font-bold">{formatNumber(stats.totalPages)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Searches</p>
                <p className="text-xl font-bold">{formatNumber(stats.totalSearches)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Pages
            </CardTitle>
            <CardDescription>
              Most viewed documentation pages in the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Page</TableHead>
                    <TableHead className="text-right w-[15%]">Views</TableHead>
                    <TableHead className="text-right w-[15%]">Visitors</TableHead>
                    <TableHead className="text-right w-[20%]">Daily Avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularPages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No page view data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    popularPages.map((page, index) => (
                      <TableRow key={index}>
                        <TableCell className="py-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate max-w-[200px]" title={formatPagePath(page.page_path)}>
                              {formatPagePath(page.page_path)}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]" title={page.page_path}>
                              {page.page_path}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {page.view_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {page.unique_visitors.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {Number(page.avg_daily_views).toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Top Referrers
            </CardTitle>
            <CardDescription>
              External sites driving traffic to your documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Domain</TableHead>
                    <TableHead className="text-right w-[20%]">References</TableHead>
                    <TableHead className="text-right w-[15%]">Pages</TableHead>
                    <TableHead className="text-right w-[25%]">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topReferrers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No referrer data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topReferrers.map((referrer, index) => (
                      <TableRow key={index}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate" title={referrer.referrer_domain}>
                              {referrer.referrer_domain}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {referrer.total_references.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {referrer.unique_pages.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm py-2">
                          {new Date(referrer.last_activity).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Analytics
          </CardTitle>
          <CardDescription>
            Most popular search queries within your documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Search Query</TableHead>
                  <TableHead className="text-right w-[15%]">Count</TableHead>
                  <TableHead className="text-right w-[20%]">Avg Results</TableHead>
                  <TableHead className="text-right w-[25%]">Last Searched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchQueries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No search data available
                    </TableCell>
                  </TableRow>
                ) : (
                  searchQueries.map((query, index) => (
                    <TableRow key={index}>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="font-mono text-xs max-w-full truncate" title={`"${query.query}"`}>
                          "{query.query}"
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm py-2">
                        {query.search_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm py-2">
                        {Number(query.avg_results).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm py-2">
                        {new Date(query.last_searched).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
