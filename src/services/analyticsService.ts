
import { supabase } from '@/integrations/supabase/client';

interface PageViewData {
  page_path: string;
  user_id?: string;
  session_id?: string;
  referrer?: string;
  user_agent?: string;
}

interface SearchData {
  query: string;
  results_count: number;
  user_id?: string;
  session_id?: string;
}

interface ReferrerData {
  page_path: string;
  referrer_domain: string;
  referrer_url?: string;
}

class AnalyticsService {
  private sessionId: string;
  private trackedViews: Map<string, number> = new Map(); // path -> timestamp
  private trackingCooldown: number = 30000; // 30 seconds cooldown between same page tracks

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private shouldTrackPath(path: string): boolean {
    // Don't track admin or edit routes
    const excludedPaths = ['/admin', '/edit'];
    return !excludedPaths.some(excludedPath => path.startsWith(excludedPath));
  }

  private shouldTrackPageView(path: string): boolean {
    const now = Date.now();
    const lastTracked = this.trackedViews.get(path);
    
    // Don't track if same path was tracked recently
    if (lastTracked && (now - lastTracked) < this.trackingCooldown) {
      console.log(`Skipping duplicate page view for ${path} (tracked ${now - lastTracked}ms ago)`);
      return false;
    }
    
    return true;
  }

  async trackPageView(path: string) {
    try {
      // Skip tracking for admin and edit routes
      if (!this.shouldTrackPath(path)) {
        return;
      }

      // Prevent rapid duplicate tracking
      if (!this.shouldTrackPageView(path)) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const pageViewData: PageViewData = {
        page_path: path,
        session_id: this.sessionId,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
      };

      if (user) {
        pageViewData.user_id = user.id;
      }

      // Check if this exact combination already exists in the last 30 seconds
      const recentCutoff = new Date(Date.now() - this.trackingCooldown);
      const { data: existingViews } = await supabase
        .from('page_views')
        .select('id')
        .eq('page_path', path)
        .eq('session_id', this.sessionId)
        .gte('created_at', recentCutoff.toISOString())
        .limit(1);

      if (existingViews && existingViews.length > 0) {
        console.log(`Duplicate page view blocked for ${path} - already exists in database`);
        return;
      }

      const { error } = await supabase
        .from('page_views')
        .insert([pageViewData]);

      if (error) {
        console.warn('Failed to track page view:', error);
        return;
      }

      // Mark this path as tracked
      this.trackedViews.set(path, Date.now());

      // Clean up old tracked paths to prevent memory leaks
      if (this.trackedViews.size > 50) {
        const cutoff = Date.now() - this.trackingCooldown;
        for (const [trackedPath, timestamp] of this.trackedViews.entries()) {
          if (timestamp < cutoff) {
            this.trackedViews.delete(trackedPath);
          }
        }
      }

      console.log(`Page view tracked for ${path} (session: ${this.sessionId.substring(0, 8)}...)`);

      // Track external referrers
      if (document.referrer && !this.isInternalReferrer(document.referrer)) {
        await this.trackReferrer(path, document.referrer);
      }
    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  }

  async trackSearch(query: string, resultsCount: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const searchData: SearchData = {
        query,
        results_count: resultsCount,
        session_id: this.sessionId,
      };

      if (user) {
        searchData.user_id = user.id;
      }

      const { error } = await supabase
        .from('search_analytics')
        .insert([searchData]);

      if (error) {
        console.warn('Failed to track search:', error);
      }
    } catch (error) {
      console.warn('Search analytics tracking error:', error);
    }
  }

  private async trackReferrer(pagePath: string, referrerUrl: string) {
    try {
      // Don't track referrers for admin/edit pages
      if (!this.shouldTrackPath(pagePath)) {
        return;
      }

      const referrerDomain = new URL(referrerUrl).hostname;
      
      const referrerData: ReferrerData = {
        page_path: pagePath,
        referrer_domain: referrerDomain,
        referrer_url: referrerUrl,
      };

      // Use upsert to increment count if referrer already exists
      const { error } = await supabase
        .from('page_references')
        .upsert([referrerData], {
          onConflict: 'page_path,referrer_domain',
          ignoreDuplicates: false,
        });

      if (error) {
        console.warn('Failed to track referrer:', error);
      }
    } catch (error) {
      console.warn('Referrer tracking error:', error);
    }
  }

  private isInternalReferrer(referrer: string): boolean {
    try {
      const referrerDomain = new URL(referrer).hostname;
      const currentDomain = window.location.hostname;
      return referrerDomain === currentDomain || referrerDomain === 'localhost';
    } catch {
      return false;
    }
  }

  // Clear session tracking (useful for testing or when session should reset)
  clearSessionTracking() {
    this.trackedViews.clear();
    sessionStorage.removeItem('analytics_session_id');
    this.sessionId = this.getOrCreateSessionId();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
