
import { useEffect, useState } from 'react';
import { sitemapService } from '@/services/sitemapService';

export default function Sitemap() {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const xml = await sitemapService.generateSitemap();
        setSitemapXml(xml);
      } catch (error) {
        console.error('Failed to generate sitemap:', error);
        setSitemapXml('<?xml version="1.0" encoding="UTF-8"?>\n<error>Failed to generate sitemap</error>');
      } finally {
        setLoading(false);
      }
    };

    generateSitemap();
  }, []);

  // Set content type to XML
  useEffect(() => {
    if (!loading) {
      // This is a workaround since we can't set response headers in a React component
      // The XML will be displayed as text, but search engines can still read it
      document.title = 'Sitemap';
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating sitemap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono text-sm">
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Sitemap.xml</h1>
          <p className="text-muted-foreground">
            XML sitemap for search engines. You can also access this at{' '}
            <code className="bg-muted px-1 rounded">/sitemap.xml</code>
          </p>
        </div>
        <pre className="bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap">
          {sitemapXml}
        </pre>
      </div>
    </div>
  );
}
