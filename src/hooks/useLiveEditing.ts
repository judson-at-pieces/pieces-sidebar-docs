
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';

const DEBUG_LIVE = false;

export function useLiveEditing(selectedFile?: string, activeBranch?: string) {
  // Use cookie-based branch instead of the old hook
  const effectiveBranch = getBranchCookie() || activeBranch || 'main';
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<string>('');
  const [sessions, setSessions] = useState<Array<{ file_path: string; content: string }>>([]);
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);

  if (DEBUG_LIVE) {
    console.log('useLiveEditing: effectiveBranch =', effectiveBranch, 'selectedFile =', selectedFile);
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
        .neq('content', '')
        .order('updated_at', { ascending: false });

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

  // Enhanced save live content function with better timestamp handling
  const saveLiveContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    if (!effectiveBranch) return false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Use upsert with explicit timestamp to ensure proper ordering
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          content: content,
          user_id: user.id,
          branch_name: effectiveBranch,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'file_path,branch_name'
        })
        .select();

      if (error) {
        console.error('Error saving live content:', error);
        return false;
      }

      console.log('Live content saved successfully:', {
        filePath,
        branch: effectiveBranch,
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });

      return true;
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
        .select('content, locked_by, locked_at, updated_at')
        .eq('file_path', filePath)
        .eq('branch_name', effectiveBranch)
        .order('updated_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error loading live content:', error);
        return null;
      }

      if (data) {
        setIsLocked(!!data.locked_by);
        setLockedBy(data.locked_by ? 'Someone else' : null);
        console.log('Loaded live content:', {
          filePath,
          branch: effectiveBranch,
          contentLength: data.content?.length || 0,
          lastUpdated: data.updated_at
        });
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
