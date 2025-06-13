
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

  private getCurrentUserId(): string | undefined {
    // Get current user ID from Supabase auth
    return supabase.auth.getUser().then(({ data }) => data.user?.id);
  }

  async trackPageView(path: string) {
    try {
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

      const { error } = await supabase
        .from('page_views')
        .insert([pageViewData]);

      if (error) {
        console.warn('Failed to track page view:', error);
      }

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
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
