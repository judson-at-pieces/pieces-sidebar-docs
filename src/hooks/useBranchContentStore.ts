
import { useState, useCallback, useRef } from 'react';
import { getBranchCookie } from '@/utils/branchCookies';

interface BranchContent {
  [filePath: string]: string;
}

interface BranchContentCache {
  [branchName: string]: BranchContent;
}

const CONTENT_CACHE_KEY = 'branch_content_cache';

export function useBranchContentStore() {
  const [contentCache, setContentCache] = useState<BranchContentCache>(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(CONTENT_CACHE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const lastSaveRef = useRef<{ branch: string; file: string; content: string } | null>(null);

  // Save content to localStorage
  const persistCache = useCallback((cache: BranchContentCache) => {
    try {
      localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to persist content cache:', error);
    }
  }, []);

  // Set content for specific branch/file
  const setContent = useCallback((branchName: string, filePath: string, content: string) => {
    console.log('📦 [ContentStore] 💾 Set content:', `${branchName}/${filePath}`, { length: content.length });
    
    setContentCache(prev => {
      const newCache = {
        ...prev,
        [branchName]: {
          ...prev[branchName],
          [filePath]: content
        }
      };
      persistCache(newCache);
      
      // Track last save
      lastSaveRef.current = { branch: branchName, file: filePath, content };
      
      return newCache;
    });
  }, [persistCache]);

  // Get content for specific branch/file
  const getContent = useCallback((branchName: string, filePath: string): string | null => {
    const content = contentCache[branchName]?.[filePath] || null;
    console.log('📦 [ContentStore] 📖 Get content:', `${branchName}/${filePath}`, { found: !!content, length: content?.length || 0 });
    return content;
  }, [contentCache]);

  // Capture current editor content before branch switch
  const captureCurrentContent = useCallback((currentBranch: string, filePath: string, editorContent: string) => {
    if (!editorContent.trim()) return;
    
    console.log('📦 [ContentStore] 📸 Capture content:', `${currentBranch}/${filePath}`, { length: editorContent.length });
    setContent(currentBranch, filePath, editorContent);
  }, [setContent]);

  // Check if content exists for branch/file
  const hasContent = useCallback((branchName: string, filePath: string): boolean => {
    return !!contentCache[branchName]?.[filePath];
  }, [contentCache]);

  // Clear content for specific branch/file
  const clearContent = useCallback((branchName: string, filePath?: string) => {
    setContentCache(prev => {
      const newCache = { ...prev };
      
      if (filePath) {
        if (newCache[branchName]) {
          delete newCache[branchName][filePath];
          if (Object.keys(newCache[branchName]).length === 0) {
            delete newCache[branchName];
          }
        }
      } else {
        delete newCache[branchName];
      }
      
      persistCache(newCache);
      return newCache;
    });
  }, [persistCache]);

  // Get all cached branches
  const getCachedBranches = useCallback((): string[] => {
    return Object.keys(contentCache);
  }, [contentCache]);

  // Get files for specific branch
  const getFilesForBranch = useCallback((branchName: string): string[] => {
    return Object.keys(contentCache[branchName] || {});
  }, [contentCache]);

  return {
    setContent,
    getContent,
    captureCurrentContent,
    hasContent,
    clearContent,
    getCachedBranches,
    getFilesForBranch,
    lastSave: lastSaveRef.current
  };
}
