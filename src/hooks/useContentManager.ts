
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

  const { currentUserId, isFileLockedByMe } = lockManager;

  // Fetch live content for current branch
  const fetchLiveContent = useCallback(async () => {
    if (!currentBranch) return;
    
    try {
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

      setLiveContent(contentMap);

      if (DEBUG_CONTENT) {
        console.log('📄 FETCHED CONTENT:', {
          branch: currentBranch,
          filesWithContent: contentMap.size,
          files: Array.from(contentMap.keys())
        });
      }
    } catch (error) {
      console.error('Error in fetchLiveContent:', error);
    }
  }, [currentBranch]);

  // Setup real-time subscription for content changes
  useEffect(() => {
    if (!currentBranch) return;
    
    console.log('📄 Setting up content subscription for branch:', currentBranch);
    
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
          console.log('📄 Content update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const session = payload.new as ContentSession;
            if (session.content && session.content.trim()) {
              setLiveContent(prev => {
                const newMap = new Map(prev);
                newMap.set(session.file_path, session.content);
                return newMap;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const session = payload.old as ContentSession;
            setLiveContent(prev => {
              const newMap = new Map(prev);
              newMap.delete(session.file_path);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('📄 Cleaning up content subscription');
      supabase.removeChannel(channel);
    };
  }, [currentBranch]);

  // Auto-save content with debouncing
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

    // Check if content has actually changed
    const lastSaved = lastSavedContentRef.current.get(filePath);
    if (lastSaved === content && !immediate) {
      return true; // No change, no need to save
    }

    const doSave = async () => {
      try {
        setIsAutoSaving(true);

        const { error } = await supabase
          .from('live_editing_sessions')
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq('file_path', filePath)
          .eq('branch_name', currentBranch)
          .eq('locked_by', currentUserId);

        if (error) {
          console.error('Error saving content:', error);
          return false;
        }

        // Update our local cache
        lastSavedContentRef.current.set(filePath, content);
        setLiveContent(prev => {
          const newMap = new Map(prev);
          newMap.set(filePath, content);
          return newMap;
        });

        if (DEBUG_CONTENT) {
          console.log('📄 Content saved successfully:', {
            filePath,
            contentLength: content.length,
            branch: currentBranch
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

  // Load content for a specific file
  const loadContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!currentBranch) return null;
    
    // Check if we have live content first
    const live = liveContent.get(filePath);
    if (live) {
      if (DEBUG_CONTENT) {
        console.log('📄 Using live content for:', filePath);
      }
      return live;
    }

    try {
      // Try to load from database
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', currentBranch)
        .maybeSingle();

      if (error) {
        console.error('Error loading content from DB:', error);
        return null;
      }

      if (data?.content) {
        if (DEBUG_CONTENT) {
          console.log('📄 Loaded content from DB for:', filePath);
        }
        return data.content;
      }

      // Fall back to file system
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
          console.log('📄 Loaded content from filesystem for:', filePath);
        }
        return content;
      }

      return null;
    } catch (error) {
      console.error('Error in loadContent:', error);
      return null;
    }
  }, [currentBranch, liveContent]);

  // Get content for a file (live or cached)
  const getContent = useCallback((filePath: string): string | null => {
    return liveContent.get(filePath) || null;
  }, [liveContent]);

  // Check if file has unsaved changes
  const hasUnsavedChanges = useCallback((filePath: string, currentContent: string): boolean => {
    const lastSaved = lastSavedContentRef.current.get(filePath);
    const liveContentForFile = liveContent.get(filePath);
    
    return currentContent !== (lastSaved || liveContentForFile || '');
  }, [liveContent]);

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
