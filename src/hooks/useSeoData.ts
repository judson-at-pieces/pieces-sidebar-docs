
import { useState, useEffect, useCallback } from 'react';

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
  const [originalContentCache, setOriginalContentCache] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const currentSeoData = selectedFile ? seoDataCache[selectedFile] || defaultSeoData : defaultSeoData;

  // Load SEO data from markdown frontmatter
  const loadSeoData = useCallback(async (filePath: string) => {
    if (seoDataCache[filePath] && originalContentCache[filePath]) {
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
      
      // Store the original content
      setOriginalContentCache(prev => ({
        ...prev,
        [filePath]: content
      }));
      
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
  }, [seoDataCache, originalContentCache]);

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

  // Convert SEO data back to frontmatter and merge with existing content
  const mergeSeoDataWithContent = (seoData: SeoData, originalContent: string): string => {
    const frontmatterMatch = originalContent.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      // No existing frontmatter, create new one
      const newFrontmatter = generateFrontmatter(seoData, {});
      return `---\n${newFrontmatter}\n---${originalContent}`;
    }
    
    const [, existingFrontmatter, contentBody] = frontmatterMatch;
    
    // Parse existing frontmatter
    const existingData: Record<string, any> = {};
    existingFrontmatter.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        existingData[key] = value.replace(/^["']|["']$/g, '');
      }
    });
    
    // Generate merged frontmatter
    const mergedFrontmatter = generateFrontmatter(seoData, existingData);
    
    return `---\n${mergedFrontmatter}\n---${contentBody}`;
  };

  // Generate frontmatter from SEO data while preserving existing fields
  const generateFrontmatter = (seoData: SeoData, existingData: Record<string, any>): string => {
    const frontmatterLines: string[] = [];
    
    // Add existing fields first (like title, path, visibility, etc.)
    Object.entries(existingData).forEach(([key, value]) => {
      // Skip SEO fields that we'll add separately
      if (!isSeoField(key)) {
        frontmatterLines.push(`${key}: "${value}"`);
      }
    });
    
    // Add SEO fields
    if (seoData.metaTitle) {
      frontmatterLines.push(`seoTitle: "${seoData.metaTitle}"`);
    }
    if (seoData.metaDescription) {
      frontmatterLines.push(`seoDescription: "${seoData.metaDescription}"`);
    }
    if (seoData.keywords.length > 0) {
      frontmatterLines.push(`seoKeywords: "${seoData.keywords.join(', ')}"`);
    }
    if (seoData.canonicalUrl) {
      frontmatterLines.push(`canonicalUrl: "${seoData.canonicalUrl}"`);
    }
    if (seoData.ogTitle) {
      frontmatterLines.push(`ogTitle: "${seoData.ogTitle}"`);
    }
    if (seoData.ogDescription) {
      frontmatterLines.push(`ogDescription: "${seoData.ogDescription}"`);
    }
    if (seoData.ogImage) {
      frontmatterLines.push(`ogImage: "${seoData.ogImage}"`);
    }
    if (seoData.ogType && seoData.ogType !== 'article') {
      frontmatterLines.push(`ogType: "${seoData.ogType}"`);
    }
    if (seoData.twitterCard && seoData.twitterCard !== 'summary_large_image') {
      frontmatterLines.push(`twitterCard: "${seoData.twitterCard}"`);
    }
    if (seoData.twitterTitle) {
      frontmatterLines.push(`twitterTitle: "${seoData.twitterTitle}"`);
    }
    if (seoData.twitterDescription) {
      frontmatterLines.push(`twitterDescription: "${seoData.twitterDescription}"`);
    }
    if (seoData.twitterImage) {
      frontmatterLines.push(`twitterImage: "${seoData.twitterImage}"`);
    }
    if (seoData.robots && seoData.robots !== 'index,follow') {
      frontmatterLines.push(`robots: "${seoData.robots}"`);
    }
    if (seoData.noindex) {
      frontmatterLines.push(`noindex: true`);
    }
    if (seoData.nofollow) {
      frontmatterLines.push(`nofollow: true`);
    }
    if (seoData.priority !== 0.8) {
      frontmatterLines.push(`priority: ${seoData.priority}`);
    }
    if (seoData.changefreq && seoData.changefreq !== 'weekly') {
      frontmatterLines.push(`changefreq: "${seoData.changefreq}"`);
    }
    if (seoData.schemaType && seoData.schemaType !== 'Article') {
      frontmatterLines.push(`schemaType: "${seoData.schemaType}"`);
    }
    
    return frontmatterLines.join('\n');
  };

  // Check if a field is an SEO field
  const isSeoField = (key: string): boolean => {
    const seoFields = [
      'seoTitle', 'seoDescription', 'seoKeywords', 'canonicalUrl',
      'ogTitle', 'ogDescription', 'ogImage', 'ogType',
      'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
      'robots', 'noindex', 'nofollow', 'priority', 'changefreq', 'schemaType'
    ];
    return seoFields.includes(key);
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

  // Save all changes with proper content merging
  const saveAllChanges = useCallback(async () => {
    if (pendingChanges.size === 0) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // For each pending change, merge SEO data with original content
      for (const filePath of pendingChanges) {
        const seoData = seoDataCache[filePath];
        const originalContent = originalContentCache[filePath];
        
        if (seoData && originalContent) {
          const mergedContent = mergeSeoDataWithContent(seoData, originalContent);
          
          // Here you would save the merged content back to the file
          // This is where you'd integrate with your file saving mechanism
          console.log('Saving merged content for', filePath, mergedContent);
          
          // Update the original content cache with the new content
          setOriginalContentCache(prev => ({
            ...prev,
            [filePath]: mergedContent
          }));
        }
      }
      
      console.log('Saved SEO data for files:', Array.from(pendingChanges));
      
      // Clear pending changes after successful save
      setPendingChanges(new Set());
      
    } catch (error) {
      console.error('Failed to save SEO data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, seoDataCache, originalContentCache]);

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
