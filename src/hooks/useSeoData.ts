
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
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentSeoData = selectedFile ? seoDataCache[selectedFile] || defaultSeoData : defaultSeoData;

  // Parse frontmatter to SEO data with better error handling
  const parseFrontmatterToSeoData = (frontmatter: string): SeoData => {
    const lines = frontmatter.split('\n');
    const data: Partial<SeoData> = {};
    
    lines.forEach(line => {
      try {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          const cleanValue = value.replace(/^["']|["']$/g, '').trim();
          
          // Only process if cleanValue exists and isn't empty
          if (cleanValue) {
            switch (key) {
              case 'title':
                data.title = cleanValue;
                break;
              case 'description':
                data.description = cleanValue;
                break;
              case 'seoTitle':
              case 'metaTitle':
                data.metaTitle = cleanValue;
                break;
              case 'seoDescription':
              case 'metaDescription':
                data.metaDescription = cleanValue;
                break;
              case 'seoKeywords':
              case 'keywords':
                if (cleanValue.includes(',')) {
                  data.keywords = cleanValue.split(',').map(k => k.trim()).filter(Boolean);
                } else if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                  // Handle array format: [item1, item2, item3]
                  const arrayContent = cleanValue.slice(1, -1);
                  data.keywords = arrayContent.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
                } else {
                  data.keywords = [cleanValue];
                }
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
              case 'ogUrl':
                data.ogUrl = cleanValue;
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
              case 'twitterSite':
                data.twitterSite = cleanValue;
                break;
              case 'twitterCreator':
                data.twitterCreator = cleanValue;
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
                const priorityNum = parseFloat(cleanValue);
                if (!isNaN(priorityNum) && priorityNum >= 0 && priorityNum <= 1) {
                  data.priority = priorityNum;
                }
                break;
              case 'changefreq':
                if (['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].includes(cleanValue)) {
                  data.changefreq = cleanValue;
                }
                break;
              case 'schemaType':
                data.schemaType = cleanValue;
                break;
              case 'schemaData':
                data.schemaData = cleanValue;
                break;
            }
          }
        }
      } catch (error) {
        console.warn('Error parsing frontmatter line:', line, error);
        // Continue processing other lines even if one fails
      }
    });
    
    return { ...defaultSeoData, ...data };
  };

  // Load SEO data from markdown frontmatter
  const loadSeoData = useCallback(async (filePath: string) => {
    if (seoDataCache[filePath]) {
      return seoDataCache[filePath];
    }

    setIsLoading(true);
    
    try {
      let markdownPath = filePath;
      if (!markdownPath.endsWith('.md')) {
        markdownPath = `${filePath}.md`;
      }
      markdownPath = markdownPath.replace(/^\/+/, '');
      
      console.log('Loading SEO data for file:', markdownPath);
      
      const response = await fetch(`/content/${markdownPath}`);
      if (!response.ok) {
        console.warn(`File not found: ${markdownPath}, using default SEO data`);
        const defaultData = { ...defaultSeoData };
        setSeoDataCache(prev => ({
          ...prev,
          [filePath]: defaultData
        }));
        return defaultData;
      }
      
      const content = await response.text();
      console.log('File content loaded, parsing frontmatter...');
      
      const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      
      if (!frontmatterMatch) {
        console.log('No frontmatter found, using default SEO data');
        const defaultData = { ...defaultSeoData };
        setSeoDataCache(prev => ({
          ...prev,
          [filePath]: defaultData
        }));
        return defaultData;
      }

      const frontmatter = frontmatterMatch[1];
      console.log('Parsing frontmatter:', frontmatter);
      const seoData = parseFrontmatterToSeoData(frontmatter);
      
      console.log('Parsed SEO data:', seoData);
      
      setSeoDataCache(prev => ({
        ...prev,
        [filePath]: seoData
      }));
      
      return seoData;
    } catch (error) {
      console.error('Failed to load SEO data for file:', filePath, error);
      const defaultData = { ...defaultSeoData };
      setSeoDataCache(prev => ({
        ...prev,
        [filePath]: defaultData
      }));
      return defaultData;
    } finally {
      setIsLoading(false);
    }
  }, [seoDataCache]);

  // Update SEO data for current file
  const updateSeoData = useCallback((updates: Partial<SeoData>) => {
    if (!selectedFile) return;
    
    setSeoDataCache(prev => ({
      ...prev,
      [selectedFile]: { ...currentSeoData, ...updates }
    }));
    
    setPendingChanges(prev => new Set(prev).add(selectedFile));
  }, [selectedFile, currentSeoData]);

  // Save all changes with debounced PR creation
  const saveAllChanges = useCallback(async () => {
    if (pendingChanges.size === 0) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Mock save operation - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saved SEO data for files:', Array.from(pendingChanges));
      
      // Clear pending changes after successful save
      setPendingChanges(new Set());
      
    } catch (error) {
      console.error('Failed to save SEO data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges]);

  // Load SEO data when file changes
  useEffect(() => {
    if (selectedFile) {
      console.log('Selected file changed to:', selectedFile);
      loadSeoData(selectedFile);
    }
  }, [selectedFile, loadSeoData]);

  return {
    seoData: currentSeoData,
    updateSeoData,
    saveAllChanges,
    pendingChanges: Array.from(pendingChanges),
    isSaving,
    isLoading,
    hasUnsavedChanges: pendingChanges.size > 0
  };
}
