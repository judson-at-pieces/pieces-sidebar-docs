
import { useState } from 'react';
import { sitemapService } from '@/services/sitemapService';

export function useSitemap() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateSitemap = async (): Promise<string> => {
    setIsGenerating(true);
    try {
      const sitemap = await sitemapService.generateSitemap();
      setLastGenerated(new Date());
      return sitemap;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSitemap = async () => {
    const sitemap = await generateSitemap();
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    isGenerating,
    lastGenerated,
    generateSitemap,
    downloadSitemap
  };
}
