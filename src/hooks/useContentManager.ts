
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';

interface ContentSession {
  file_path: string;
  content: string;
  user_id: string;
  branch_name: string;
  updated_at: string;
}

const DEBUG_CONTENT = true;

export function useContentManager(lockManager: any) {
  const [liveContent, setLiveContent] = useState<Map<string, string>>(new Map());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const currentBranch = getBranchCookie() || 'main';
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef<Map<string, string>>(new Map());
  const branchContentCacheRef = useRef<Map<string, Map<string, string>>>(new Map());

  const { currentUserId, isFileLockedByMe } = lockManager;

  // Clear cache when branch changes and force reload from Supabase
  useEffect(() => {
    if (currentBranch) {
      if (DEBUG_CONTENT) {
        console.log('📄 Branch changed to:', currentBranch, 'clearing ALL caches and forcing reload');
      }
      // CLEAR EVERYTHING when branch changes
      setLiveContent(new Map());
      lastSavedContentRef.current = new Map();
      
      // Force fresh fetch from database for this branch
      fetchLiveContent();
    }
  }, [currentBranch]);

  // Fetch live content for current branch DIRECTLY from Supabase
  const fetchLiveContent = useCallback(async () => {
    if (!currentBranch) return;
    
    try {
      if (DEBUG_CONTENT) {
        console.log('📄 FETCHING FRESH content from Supabase for branch:', currentBranch);
      }

      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content, user_id, branch_name, updated_at')
        .eq('branch_name', currentBranch)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching live content:', error);
        return;
      }

      const contentMap = new Map<string, string>();
      (data || []).forEach(session => {
        contentMap.set(session.file_path, session.content);
      });

      // Update both live content and cache
      setLiveContent(contentMap);
      branchContentCacheRef.current.set(currentBranch, contentMap);

      if (DEBUG_CONTENT) {
        console.log('📄 LOADED FRESH BRANCH CONTENT from Supabase:', {
          branch: currentBranch,
          filesWithContent: contentMap.size,
          files: Array.from(contentMap.keys()),
          sampleContent: Array.from(contentMap.entries()).slice(0, 2).map(([path, content]) => ({
            path,
            contentLength: content.length,
            preview: content.substring(0, 100)
          }))
        });
      }
    } catch (error) {
      console.error('Error in fetchLiveContent:', error);
    }
  }, [currentBranch]);

  // Setup real-time subscription for content changes
  useEffect(() => {
    if (!currentBranch) return;
    
    console.log('📄 Setting up branch-specific content subscription for:', currentBranch);
    
    const channel = supabase
      .channel(`content_${currentBranch}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions',
          filter: `branch_name=eq.${currentBranch}`
        },
        (payload) => {
          console.log('📄 Branch content update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const session = payload.new as ContentSession;
            if (session.content && session.content.trim()) {
              setLiveContent(prev => {
                const newMap = new Map(prev);
                newMap.set(session.file_path, session.content);
                
                // Update branch cache
                const branchCache = branchContentCacheRef.current.get(currentBranch) || new Map();
                branchCache.set(session.file_path, session.content);
                branchContentCacheRef.current.set(currentBranch, branchCache);
                
                return newMap;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const session = payload.old as ContentSession;
            setLiveContent(prev => {
              const newMap = new Map(prev);
              newMap.delete(session.file_path);
              
              // Update branch cache
              const branchCache = branchContentCacheRef.current.get(currentBranch) || new Map();
              branchCache.delete(session.file_path);
              branchContentCacheRef.current.set(currentBranch, branchCache);
              
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('📄 Cleaning up branch content subscription for:', currentBranch);
      supabase.removeChannel(channel);
    };
  }, [currentBranch]);

  // Auto-save content with branch awareness
  const saveContent = useCallback(async (filePath: string, content: string, immediate = false) => {
    if (!currentUserId || !currentBranch || !isFileLockedByMe(filePath)) {
      if (DEBUG_CONTENT) {
        console.log('📄 Cannot save - no permission:', {
          currentUserId,
          currentBranch,
          hasLock: isFileLockedByMe(filePath)
        });
      }
      return false;
    }

    // Check if content has actually changed for this branch
    const branchKey = `${currentBranch}:${filePath}`;
    const lastSaved = lastSavedContentRef.current.get(branchKey);
    if (lastSaved === content && !immediate) {
      return true; // No change, no need to save
    }

    const doSave = async () => {
      try {
        setIsAutoSaving(true);

        const { error } = await supabase
          .from('live_editing_sessions')
          .upsert({
            file_path: filePath,
            content,
            user_id: currentUserId,
            branch_name: currentBranch,
            locked_by: currentUserId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'file_path,branch_name'
          });

        if (error) {
          console.error('Error saving branch content:', error);
          return false;
        }

        // Update our local cache with branch awareness
        lastSavedContentRef.current.set(branchKey, content);
        setLiveContent(prev => {
          const newMap = new Map(prev);
          newMap.set(filePath, content);
          return newMap;
        });

        // Update branch cache
        const branchCache = branchContentCacheRef.current.get(currentBranch) || new Map();
        branchCache.set(filePath, content);
        branchContentCacheRef.current.set(currentBranch, branchCache);

        if (DEBUG_CONTENT) {
          console.log('📄 Branch content saved successfully:', {
            filePath,
            branch: currentBranch,
            contentLength: content.length
          });
        }

        return true;
      } catch (error) {
        console.error('Error in saveContent:', error);
        return false;
      } finally {
        setIsAutoSaving(false);
      }
    };

    if (immediate) {
      return await doSave();
    } else {
      // Debounced save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        await doSave();
      }, 1000); // 1 second debounce

      return true;
    }
  }, [currentUserId, currentBranch, isFileLockedByMe]);

  // Load content for a specific file with FORCED branch isolation
  const loadContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!currentBranch) return null;
    
    if (DEBUG_CONTENT) {
      console.log('📄 LOADING content for file:', filePath, 'in branch:', currentBranch);
    }

    try {
      // ALWAYS fetch from database first for this specific branch
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', currentBranch)
        .maybeSingle();

      if (error) {
        console.error('Error loading branch content from DB:', error);
        return null;
      }

      if (data?.content) {
        if (DEBUG_CONTENT) {
          console.log('📄 Found existing branch content in Supabase:', {
            filePath,
            branch: currentBranch,
            contentLength: data.content.length,
            preview: data.content.substring(0, 100)
          });
        }
        
        // Update caches
        const branchCache = branchContentCacheRef.current.get(currentBranch) || new Map();
        branchCache.set(filePath, data.content);
        branchContentCacheRef.current.set(currentBranch, branchCache);
        
        setLiveContent(prev => {
          const newMap = new Map(prev);
          newMap.set(filePath, data.content);
          return newMap;
        });
        
        return data.content;
      }

      // If no branch-specific content exists, try to load from filesystem
      let fetchPath = filePath;
      if (!fetchPath.endsWith('.md')) {
        fetchPath = `${fetchPath}.md`;
      }
      
      const cleanFetchPath = fetchPath.replace(/^\/+/, '');
      const fetchUrl = `/content/${cleanFetchPath}`;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/markdown, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        if (DEBUG_CONTENT) {
          console.log('📄 Loaded fresh content from filesystem for new branch:', {
            filePath,
            branch: currentBranch,
            contentLength: content.length
          });
        }
        return content;
      }

      if (DEBUG_CONTENT) {
        console.log('📄 No content found for:', filePath, 'in branch:', currentBranch);
      }
      return null;
    } catch (error) {
      console.error('Error in loadContent:', error);
      return null;
    }
  }, [currentBranch]);

  // Get content for a file (live or cached) with branch awareness
  const getContent = useCallback((filePath: string): string | null => {
    // Always check live content first (most current)
    const liveContentForFile = liveContent.get(filePath);
    if (liveContentForFile) {
      return liveContentForFile;
    }
    
    // Fall back to branch cache
    const branchCache = branchContentCacheRef.current.get(currentBranch);
    if (branchCache?.has(filePath)) {
      return branchCache.get(filePath) || null;
    }
    
    return null;
  }, [liveContent, currentBranch]);

  // Check if file has unsaved changes with branch awareness
  const hasUnsavedChanges = useCallback((filePath: string, currentContent: string): boolean => {
    const branchKey = `${currentBranch}:${filePath}`;
    const lastSaved = lastSavedContentRef.current.get(branchKey);
    const liveContentForFile = liveContent.get(filePath);
    
    return currentContent !== (lastSaved || liveContentForFile || '');
  }, [liveContent, currentBranch]);

  // Initial fetch
  useEffect(() => {
    fetchLiveContent();
  }, [fetchLiveContent]);

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    liveContent,
    isAutoSaving,
    
    // Actions
    saveContent,
    loadContent,
    
    // Helpers
    getContent,
    hasUnsavedChanges,
    
    // Utils
    refreshContent: fetchLiveContent
  };
}
