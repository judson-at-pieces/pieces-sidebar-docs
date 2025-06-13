
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
        
        // Set page title for XML
        document.title = 'Sitemap';
        
      } catch (error) {
        console.error('Failed to generate sitemap:', error);
        setSitemapXml('<?xml version="1.0" encoding="UTF-8"?>\n<error>Failed to generate sitemap</error>');
      } finally {
        setLoading(false);
      }
    };

    generateSitemap();
  }, []);

  // For loading state, show minimal content
  if (loading) {
    return <pre>Generating sitemap...</pre>;
  }

  // Return raw XML as plain text
  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      margin: 0, 
      padding: 0,
      backgroundColor: 'white',
      color: 'black'
    }}>
      {sitemapXml}
    </pre>
  );
}
