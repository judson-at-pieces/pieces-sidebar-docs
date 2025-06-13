
import { navigationService } from './navigationService';
import type { NavigationSection, NavigationItem } from './navigationService';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

class SitemapService {
  private baseUrl: string;

  constructor() {
    // Get base URL from current location, fallback to localhost for development
    this.baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://yourdomain.com'; // Replace with your production domain
  }

  async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];

    // Add homepage
    urls.push({
      loc: this.baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 1.0
    });

    // Add documentation index
    urls.push({
      loc: `${this.baseUrl}/docs`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.9
    });

    try {
      // Get navigation structure and extract all pages
      const navigation = await navigationService.getNavigationStructure();
      
      // Process navigation sections and items
      this.processNavigationItems(navigation.sections, urls);

      // Add other important static pages
      const staticPages = [
        { path: '/auth', priority: 0.3, changefreq: 'monthly' as const },
      ];

      staticPages.forEach(page => {
        urls.push({
          loc: `${this.baseUrl}${page.path}`,
          lastmod: new Date().toISOString(),
          changefreq: page.changefreq,
          priority: page.priority
        });
      });

    } catch (error) {
      console.error('Error generating sitemap:', error);
    }

    return this.generateXML(urls);
  }

  private processNavigationItems(sections: NavigationSection[], urls: SitemapUrl[]) {
    sections.forEach(section => {
      if (section.items) {
        this.extractUrlsFromItems(section.items, urls);
      }
    });
  }

  private extractUrlsFromItems(items: NavigationItem[], urls: SitemapUrl[]) {
    items.forEach(item => {
      if (item.href) {
        // Skip external links and admin/auth routes
        if (!item.href.startsWith('http') && 
            !item.href.startsWith('/admin') && 
            !item.href.startsWith('/edit') &&
            !item.href.startsWith('/auth')) {
          
          urls.push({
            loc: `${this.baseUrl}${item.href}`,
            lastmod: new Date().toISOString(),
            changefreq: 'weekly',
            priority: this.calculatePriority(item.href)
          });
        }
      }

      // Process nested items
      if (item.items && item.items.length > 0) {
        this.extractUrlsFromItems(item.items, urls);
      }
    });
  }

  private calculatePriority(href: string): number {
    // Higher priority for main sections
    if (href === '/docs/getting-started' || href === '/getting-started') return 0.9;
    if (href === '/docs/meet-pieces' || href === '/meet-pieces') return 0.8;
    if (href.match(/^\/docs?\/(quick-guides|installation)/)) return 0.8;
    if (href.match(/^\/docs?\/[^\/]+$/)) return 0.7; // Top-level docs
    return 0.6; // Sub-pages
  }

  private generateXML(urls: SitemapUrl[]): string {
    const urlEntries = urls.map(url => {
      let entry = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      
      if (url.lastmod) {
        entry += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        entry += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        entry += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }
      
      entry += `  </url>`;
      return entry;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}

export const sitemapService = new SitemapService();
