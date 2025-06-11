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

  const { currentUserId, isFileLockedByMe } = lockManager;

  // Simple branch-aware content fetching
  const fetchContentForBranch = useCallback(async (branch: string) => {
    if (DEBUG_CONTENT) {
      console.log('📄 Fetching content for branch:', branch);
    }

    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content, user_id, branch_name, updated_at')
        .eq('branch_name', branch)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching content:', error);
        return new Map();
      }

      const contentMap = new Map<string, string>();
      (data || []).forEach(session => {
        contentMap.set(session.file_path, session.content);
      });

      if (DEBUG_CONTENT) {
        console.log('📄 Loaded content for branch:', branch, 'Files:', contentMap.size);
      }

      return contentMap;
    } catch (error) {
      console.error('Error in fetchContentForBranch:', error);
      return new Map();
    }
  }, []);

  // Load content when branch changes
  useEffect(() => {
    if (currentBranch) {
      if (DEBUG_CONTENT) {
        console.log('📄 Branch changed to:', currentBranch);
      }
      
      fetchContentForBranch(currentBranch).then(contentMap => {
        setLiveContent(contentMap);
      });
    }
  }, [currentBranch, fetchContentForBranch]);

  // Real-time subscription for current branch
  useEffect(() => {
    if (!currentBranch) return;
    
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
          if (DEBUG_CONTENT) {
            console.log('📄 Real-time update for branch:', currentBranch, payload);
          }
          
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
      supabase.removeChannel(channel);
    };
  }, [currentBranch]);

  // Enhanced save content with branch parameter - FIXED TO PREVENT OVERWRITE
  const saveContentToBranch = useCallback(async (filePath: string, content: string, branchName: string): Promise<boolean> => {
    if (!currentUserId || !branchName) {
      return false;
    }

    try {
      setIsAutoSaving(true);

      if (DEBUG_CONTENT) {
        console.log('📄 Saving content to specific branch:', {
          filePath,
          branchName,
          contentLength: content.length,
          contentPreview: content.substring(0, 100) + '...'
        });
      }

      const { error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          content,
          user_id: currentUserId,
          branch_name: branchName, // Use the specific branch parameter
          locked_by: currentUserId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'file_path,branch_name'
        });

      if (error) {
        console.error('Error saving content to branch:', error);
        return false;
      }

      if (DEBUG_CONTENT) {
        console.log('📄 Content successfully saved to branch:', branchName, 'file:', filePath);
      }

      return true;
    } catch (error) {
      console.error('Error in saveContentToBranch:', error);
      return false;
    } finally {
      setIsAutoSaving(false);
    }
  }, [currentUserId]);

  // Enhanced refresh for specific branch - FORCE CLEAR CACHE
  const refreshContentForBranch = useCallback(async (branchName: string) => {
    if (DEBUG_CONTENT) {
      console.log('🔄 Force refreshing content for branch (clearing cache):', branchName);
    }
    
    // Force clear the current cache
    setLiveContent(new Map());
    
    const contentMap = await fetchContentForBranch(branchName);
    
    // Only update if this is still the current branch
    if (branchName === getBranchCookie()) {
      setLiveContent(contentMap);
      if (DEBUG_CONTENT) {
        console.log('🔄 Cache cleared and content refreshed for branch:', branchName);
      }
    }
  }, [fetchContentForBranch]);

  // Force load content bypassing cache - ENHANCED WITH BETTER DEBUGGING
  const loadContentForced = useCallback(async (filePath: string, branchName: string): Promise<string | null> => {
    if (DEBUG_CONTENT) {
      console.log('📄 FORCE loading content for file:', filePath, 'branch:', branchName, '(bypassing cache)');
    }

    try {
      // Force fetch from database, bypassing cache completely
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', branchName)
        .maybeSingle();

      if (error) {
        console.error('Error force loading content:', error);
        return null;
      }

      if (data?.content) {
        if (DEBUG_CONTENT) {
          console.log('📄 FORCE loaded from database for branch:', branchName, 'content length:', data.content.length);
        }
        return data.content;
      }

      // Fallback to file system
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
          console.log('📄 FORCE loaded from filesystem, length:', content.length);
        }
        return content;
      }

      return null;
    } catch (error) {
      console.error('Error in loadContentForced:', error);
      return null;
    }
  }, []);

  // Save content to current branch
  const saveContent = useCallback(async (filePath: string, content: string, immediate = false) => {
    if (!currentUserId || !currentBranch || !isFileLockedByMe(filePath)) {
      return false;
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
          console.error('Error saving content:', error);
          return false;
        }

        if (DEBUG_CONTENT) {
          console.log('📄 Content saved for branch:', currentBranch, 'file:', filePath);
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
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(doSave, 1000);
      return true;
    }
  }, [currentUserId, currentBranch, isFileLockedByMe]);

  // Load content for a specific file
  const loadContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!currentBranch) return null;
    
    if (DEBUG_CONTENT) {
      console.log('📄 Loading content for file:', filePath, 'branch:', currentBranch);
    }

    try {
      // Check live content first
      const liveContentForFile = liveContent.get(filePath);
      if (liveContentForFile) {
        if (DEBUG_CONTENT) {
          console.log('📄 Found in live content cache');
        }
        return liveContentForFile;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', currentBranch)
        .maybeSingle();

      if (error) {
        console.error('Error loading content:', error);
        return null;
      }

      if (data?.content) {
        if (DEBUG_CONTENT) {
          console.log('📄 Found in database for branch:', currentBranch);
        }
        return data.content;
      }

      // Fallback to file system
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
          console.log('📄 Loaded from filesystem');
        }
        return content;
      }

      return null;
    } catch (error) {
      console.error('Error in loadContent:', error);
      return null;
    }
  }, [currentBranch, liveContent]);

  const getContent = useCallback((filePath: string): string | null => {
    return liveContent.get(filePath) || null;
  }, [liveContent]);

  const hasUnsavedChanges = useCallback((filePath: string, currentContent: string): boolean => {
    const savedContent = liveContent.get(filePath) || '';
    return currentContent !== savedContent;
  }, [liveContent]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    liveContent,
    isAutoSaving,
    saveContent,
    saveContentToBranch,
    loadContent,
    loadContentForced,
    getContent,
    hasUnsavedChanges,
    refreshContent: () => fetchContentForBranch(currentBranch).then(setLiveContent),
    refreshContentForBranch
  };
}
