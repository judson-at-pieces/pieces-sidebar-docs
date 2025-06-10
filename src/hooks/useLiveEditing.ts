
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBranchManager } from './useBranchManager';

const DEBUG_LIVE = false;

export function useLiveEditing(selectedFile?: string, activeBranch?: string) {
  const { currentBranch: branchFromHook, initialized: branchesInitialized } = useBranchManager();
  
  // Use the branch from useBranchManager hook if available, otherwise fall back to activeBranch prop or 'main'
  const effectiveBranch = branchesInitialized && branchFromHook ? branchFromHook : (activeBranch || 'main');
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<string>('');
  const [sessions, setSessions] = useState<Array<{ file_path: string; content: string }>>([]);
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);

  if (DEBUG_LIVE) {
    console.log('useLiveEditing: activeBranch =', effectiveBranch, 'selectedFile =', selectedFile);
  }

  // Fetch sessions for current branch
  const fetchSessions = useCallback(async () => {
    if (!effectiveBranch) return;
    
    try {
      console.log('Fetching sessions for branch:', effectiveBranch);
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content, locked_by, locked_at, updated_at, branch_name, user_id')
        .eq('branch_name', effectiveBranch)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      const filteredSessions = (data || [])
        .filter(session => session.content && session.content.trim())
        .map(session => ({
          file_path: session.file_path,
          content: session.content
        }));

      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error in fetchSessions:', error);
    }
  }, [effectiveBranch]);

  // Setup real-time subscription
  useEffect(() => {
    if (!effectiveBranch) return;
    
    console.log('Setting up real-time subscription for branch:', effectiveBranch);
    
    const channel = supabase
      .channel(`live_editing_${effectiveBranch}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions',
          filter: `branch_name=eq.${effectiveBranch}`
        },
        (payload) => {
          console.log('Real-time update for branch:', effectiveBranch, payload);
          fetchSessions();
          
          if (selectedFile && payload.new && payload.new.file_path === selectedFile) {
            const session = payload.new as any;
            setIsLocked(!!session.locked_by);
            setLockedBy(session.locked_by === session.user_id ? 'You' : 'Someone else');
            if (session.content && session.locked_by !== session.user_id) {
              setLiveContent(session.content);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscription for branch:', effectiveBranch);
      supabase.removeChannel(channel);
    };
  }, [effectiveBranch, selectedFile, fetchSessions]);

  // Clear state when branch changes
  useEffect(() => {
    console.log('Clearing live editing state for branch:', effectiveBranch);
    setIsLocked(false);
    setLockedBy(null);
    setLiveContent('');
    fetchSessions();
  }, [effectiveBranch, fetchSessions]);

  // Acquire lock function
  const acquireLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!effectiveBranch) return false;
    
    setIsAcquiringLock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('acquire_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: user.id,
        p_branch_name: effectiveBranch
      });

      if (error) {
        console.error('Error acquiring lock:', error);
        return false;
      }

      if (data) {
        setIsLocked(true);
        setLockedBy('You');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in acquireLock:', error);
      return false;
    } finally {
      setIsAcquiringLock(false);
    }
  }, [effectiveBranch]);

  // Release lock function
  const releaseLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!effectiveBranch) return false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('release_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: user.id,
        p_branch_name: effectiveBranch
      });

      if (error) {
        console.error('Error releasing lock:', error);
        return false;
      }

      setIsLocked(false);
      setLockedBy(null);
      return true;
    } catch (error) {
      console.error('Error in releaseLock:', error);
      return false;
    }
  }, [effectiveBranch]);

  // Save live content function
  const saveLiveContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    if (!effectiveBranch) return false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('save_live_content_by_branch', {
        p_file_path: filePath,
        p_content: content,
        p_user_id: user.id,
        p_branch_name: effectiveBranch
      });

      if (error) {
        console.error('Error saving live content:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in saveLiveContent:', error);
      return false;
    }
  }, [effectiveBranch]);

  // Load live content function
  const loadLiveContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!effectiveBranch) return null;
    
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content, locked_by, locked_at')
        .eq('file_path', filePath)
        .eq('branch_name', effectiveBranch)
        .maybeSingle();

      if (error) {
        console.error('Error loading live content:', error);
        return null;
      }

      if (data) {
        setIsLocked(!!data.locked_by);
        setLockedBy(data.locked_by ? 'Someone else' : null);
        return data.content || null;
      }

      return null;
    } catch (error) {
      console.error('Error in loadLiveContent:', error);
      return null;
    }
  }, [effectiveBranch]);

  return {
    isLocked,
    lockedBy,
    liveContent,
    sessions,
    isAcquiringLock,
    acquireLock,
    releaseLock,
    saveLiveContent,
    loadLiveContent,
  };
}
