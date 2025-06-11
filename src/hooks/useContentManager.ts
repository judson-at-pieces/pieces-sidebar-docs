
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
  const [currentBranch, setCurrentBranch] = useState<string>(getBranchCookie() || 'main');
  const isBranchSwitching = useRef(false);

  const { currentUserId, isFileLockedByMe } = lockManager;

  // Listen for branch cookie changes
  useEffect(() => {
    const checkBranchCookie = () => {
      const cookieBranch = getBranchCookie() || 'main';
      if (cookieBranch !== currentBranch) {
        if (DEBUG_CONTENT) {
          console.log('📄 Branch cookie changed from:', currentBranch, 'to:', cookieBranch);
        }
        isBranchSwitching.current = true;
        setCurrentBranch(cookieBranch);
        
        setTimeout(() => {
          isBranchSwitching.current = false;
        }, 1000);
      }
    };

    checkBranchCookie();
    const interval = setInterval(checkBranchCookie, 200);
    return () => clearInterval(interval);
  }, [currentBranch]);

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
        console.log('📄 Branch changed to:', currentBranch, '- fetching content');
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

  // Simple immediate save function
  const saveContentToBranch = useCallback(async (filePath: string, content: string, branchName: string) => {
    if (!currentUserId || !branchName) {
      return false;
    }

    try {
      if (DEBUG_CONTENT) {
        console.log('📄 Saving content for:', filePath, 'branch:', branchName);
      }

      const { error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          content,
          user_id: currentUserId,
          branch_name: branchName,
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
        console.log('📄 Content saved successfully');
      }

      return true;
    } catch (error) {
      console.error('Error in saveContentToBranch:', error);
      return false;
    }
  }, [currentUserId]);

  // Force refresh for specific branch
  const refreshContentForBranch = useCallback(async (branchName: string) => {
    if (DEBUG_CONTENT) {
      console.log('🔄 Force refreshing content for branch:', branchName);
    }
    
    setLiveContent(new Map());
    const contentMap = await fetchContentForBranch(branchName);
    
    if (branchName === currentBranch) {
      setLiveContent(contentMap);
    }
  }, [fetchContentForBranch, currentBranch]);

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

  const pauseAutoSave = useCallback(() => {
    isBranchSwitching.current = true;
  }, []);

  const resumeAutoSave = useCallback(() => {
    setTimeout(() => {
      isBranchSwitching.current = false;
    }, 500);
  }, []);

  return {
    liveContent,
    currentBranch,
    saveContentToBranch,
    loadContent,
    getContent,
    hasUnsavedChanges,
    refreshContent: () => fetchContentForBranch(currentBranch).then(setLiveContent),
    refreshContentForBranch,
    pauseAutoSave,
    resumeAutoSave,
    isBranchSwitching: () => isBranchSwitching.current
  };
}
