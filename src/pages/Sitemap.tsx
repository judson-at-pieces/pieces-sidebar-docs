
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
        
        // Set the content type to XML
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Type';
        meta.content = 'application/xml; charset=utf-8';
        document.head.appendChild(meta);
        
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
    return <div>Generating sitemap...</div>;
  }

  // Return raw XML without any HTML wrapper
  return (
    <div 
      style={{ 
        fontFamily: 'monospace', 
        whiteSpace: 'pre-wrap', 
        margin: 0, 
        padding: 0,
        backgroundColor: 'white',
        color: 'black'
      }}
      dangerouslySetInnerHTML={{ __html: sitemapXml }}
    />
  );
}
