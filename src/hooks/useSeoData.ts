
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface SeoData {
  // Basic SEO
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  
  // Meta tags
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  
  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  
  // Twitter Cards
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  twitterCreator: string;
  
  // Technical SEO
  robots: string;
  noindex: boolean;
  nofollow: boolean;
  priority: number;
  changefreq: string;
  
  // Schema.org
  schemaType: string;
  schemaData: string;
  
  // Additional
  customMeta: Array<{ name: string; content: string; property?: string }>;
}

const defaultSeoData: SeoData = {
  title: "",
  description: "",
  keywords: [],
  canonicalUrl: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogType: "article",
  ogUrl: "",
  twitterCard: "summary_large_image",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  twitterSite: "@pieces_app",
  twitterCreator: "",
  robots: "index,follow",
  noindex: false,
  nofollow: false,
  priority: 0.8,
  changefreq: "weekly",
  schemaType: "Article",
  schemaData: "",
  customMeta: []
};

export function useSeoData(selectedFile?: string) {
  const [seoDataCache, setSeoDataCache] = useState<Record<string, SeoData>>({});
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const currentSeoData = selectedFile ? seoDataCache[selectedFile] || defaultSeoData : defaultSeoData;

  // Load SEO data from markdown frontmatter
  const loadSeoData = useCallback(async (filePath: string) => {
    if (seoDataCache[filePath]) {
      return seoDataCache[filePath];
    }

    try {
      let markdownPath = filePath;
      if (!markdownPath.endsWith('.md')) {
        markdownPath = `${filePath}.md`;
      }
      markdownPath = markdownPath.replace(/^\/+/, '');
      
      const response = await fetch(`/content/${markdownPath}`);
      if (!response.ok) {
        return defaultSeoData;
      }
      
      const content = await response.text();
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        return defaultSeoData;
      }

      const frontmatter = frontmatterMatch[1];
      const seoData = parseFrontmatterToSeoData(frontmatter);
      
      setSeoDataCache(prev => ({
        ...prev,
        [filePath]: seoData
      }));
      
      return seoData;
    } catch (error) {
      console.error('Failed to load SEO data:', error);
      return defaultSeoData;
    }
  }, [seoDataCache]);

  // Parse frontmatter to SEO data
  const parseFrontmatterToSeoData = (frontmatter: string): SeoData => {
    const lines = frontmatter.split('\n');
    const data: Partial<SeoData> = {};
    
    lines.forEach(line => {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        switch (key) {
          case 'seoTitle':
            data.metaTitle = cleanValue;
            break;
          case 'seoDescription':
            data.metaDescription = cleanValue;
            break;
          case 'seoKeywords':
            data.keywords = cleanValue.split(',').map(k => k.trim()).filter(Boolean);
            break;
          case 'canonicalUrl':
            data.canonicalUrl = cleanValue;
            break;
          case 'ogTitle':
            data.ogTitle = cleanValue;
            break;
          case 'ogDescription':
            data.ogDescription = cleanValue;
            break;
          case 'ogImage':
            data.ogImage = cleanValue;
            break;
          case 'ogType':
            data.ogType = cleanValue;
            break;
          case 'twitterCard':
            data.twitterCard = cleanValue;
            break;
          case 'twitterTitle':
            data.twitterTitle = cleanValue;
            break;
          case 'twitterDescription':
            data.twitterDescription = cleanValue;
            break;
          case 'twitterImage':
            data.twitterImage = cleanValue;
            break;
          case 'robots':
            data.robots = cleanValue;
            break;
          case 'noindex':
            data.noindex = cleanValue === 'true';
            break;
          case 'nofollow':
            data.nofollow = cleanValue === 'true';
            break;
          case 'priority':
            data.priority = parseFloat(cleanValue) || 0.8;
            break;
          case 'changefreq':
            data.changefreq = cleanValue;
            break;
          case 'schemaType':
            data.schemaType = cleanValue;
            break;
        }
      }
    });
    
    return { ...defaultSeoData, ...data };
  };

  // Update SEO data for current file
  const updateSeoData = useCallback((updates: Partial<SeoData>) => {
    if (!selectedFile) return;
    
    setSeoDataCache(prev => ({
      ...prev,
      [selectedFile]: { ...currentSeoData, ...updates }
    }));
    
    setPendingChanges(prev => new Set(prev).add(selectedFile));
  }, [selectedFile, currentSeoData]);

  // Save SEO data to markdown frontmatter
  const saveSeoData = useCallback(async (filePath: string, seoData: SeoData) => {
    try {
      let markdownPath = filePath;
      if (!markdownPath.endsWith('.md')) {
        markdownPath = `${filePath}.md`;
      }
      markdownPath = markdownPath.replace(/^\/+/, '');
      
      const response = await fetch(`/content/${markdownPath}`);
      let originalContent = '';
      
      if (response.ok) {
        originalContent = await response.text();
      }
      
      const updatedContent = updateMarkdownFrontmatter(originalContent, seoData);
      
      // For now, just log the updated content since we can't actually write files
      // In a real implementation, this would send to a backend API
      console.log('Updated markdown content for:', markdownPath);
      console.log('Content:', updatedContent);
      
      toast.success(`SEO data prepared for ${filePath} - ready for PR`);
      
      setPendingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save SEO data:', error);
      toast.error(`Failed to save SEO data for ${filePath}`);
      return false;
    }
  }, []);

  // Update markdown frontmatter while preserving existing fields
  const updateMarkdownFrontmatter = (content: string, seoData: SeoData): string => {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---(.*)$/s);
    
    let existingFrontmatter = '';
    let markdownContent = content;
    
    if (frontmatterMatch) {
      existingFrontmatter = frontmatterMatch[1];
      markdownContent = frontmatterMatch[2];
    }
    
    // Parse existing frontmatter to preserve non-SEO fields
    const existingLines = existingFrontmatter.split('\n').filter(line => {
      const key = line.split(':')[0];
      // Remove SEO-related fields so we can replace them
      return ![
        'seoTitle', 'seoDescription', 'seoKeywords', 'canonicalUrl',
        'ogTitle', 'ogDescription', 'ogImage', 'ogType',
        'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
        'robots', 'noindex', 'nofollow', 'priority', 'changefreq', 'schemaType'
      ].includes(key);
    });
    
    // Build new frontmatter
    const newFrontmatter = [
      ...existingLines,
      // Add SEO fields
      seoData.metaTitle ? `seoTitle: "${seoData.metaTitle}"` : '',
      seoData.metaDescription ? `seoDescription: "${seoData.metaDescription}"` : '',
      seoData.keywords.length ? `seoKeywords: "${seoData.keywords.join(', ')}"` : '',
      seoData.canonicalUrl ? `canonicalUrl: "${seoData.canonicalUrl}"` : '',
      seoData.ogTitle ? `ogTitle: "${seoData.ogTitle}"` : '',
      seoData.ogDescription ? `ogDescription: "${seoData.ogDescription}"` : '',
      seoData.ogImage ? `ogImage: "${seoData.ogImage}"` : '',
      seoData.ogType !== 'article' ? `ogType: "${seoData.ogType}"` : '',
      seoData.twitterCard !== 'summary_large_image' ? `twitterCard: "${seoData.twitterCard}"` : '',
      seoData.twitterTitle ? `twitterTitle: "${seoData.twitterTitle}"` : '',
      seoData.twitterDescription ? `twitterDescription: "${seoData.twitterDescription}"` : '',
      seoData.twitterImage ? `twitterImage: "${seoData.twitterImage}"` : '',
      seoData.robots !== 'index,follow' ? `robots: "${seoData.robots}"` : '',
      seoData.noindex ? `noindex: true` : '',
      seoData.nofollow ? `nofollow: true` : '',
      seoData.priority !== 0.8 ? `priority: ${seoData.priority}` : '',
      seoData.changefreq !== 'weekly' ? `changefreq: "${seoData.changefreq}"` : '',
      seoData.schemaType !== 'Article' ? `schemaType: "${seoData.schemaType}"` : ''
    ].filter(Boolean);
    
    return `---\n${newFrontmatter.join('\n')}\n---${markdownContent}`;
  };

  // Save all pending changes
  const saveAllChanges = useCallback(async () => {
    if (pendingChanges.size === 0) {
      toast.info('No changes to save');
      return;
    }
    
    setIsSaving(true);
    const results = [];
    
    for (const filePath of pendingChanges) {
      const seoData = seoDataCache[filePath];
      if (seoData) {
        const result = await saveSeoData(filePath, seoData);
        results.push({ filePath, success: result });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      toast.success(`All ${successCount} files prepared for PR`);
    } else {
      toast.warning(`${successCount}/${totalCount} files saved successfully`);
    }
    
    setIsSaving(false);
  }, [pendingChanges, seoDataCache, saveSeoData]);

  // Load SEO data when file changes
  useEffect(() => {
    if (selectedFile) {
      loadSeoData(selectedFile);
    }
  }, [selectedFile, loadSeoData]);

  return {
    seoData: currentSeoData,
    updateSeoData,
    saveAllChanges,
    pendingChanges: Array.from(pendingChanges),
    isSaving,
    hasUnsavedChanges: pendingChanges.size > 0
  };
}
