
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  if (DEBUG_LIVE) {
    console.log('useLiveEditing: effectiveBranch =', effectiveBranch, 'selectedFile =', selectedFile);
  }

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

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

      // Update lock status for current file
      if (selectedFile) {
        const currentFileSession = data?.find(session => session.file_path === selectedFile);
        if (currentFileSession) {
          const hasLock = currentFileSession.locked_by === currentUserId;
          const isLockedBySomeone = !!currentFileSession.locked_by;
          
          setIsLocked(isLockedBySomeone);
          setLockedBy(hasLock ? 'You' : (isLockedBySomeone ? 'Someone else' : null));
          
          if (DEBUG_LIVE) {
            console.log('Lock status update:', {
              file: selectedFile,
              locked_by: currentFileSession.locked_by,
              currentUserId,
              hasLock,
              isLockedBySomeone,
              lockedBy: hasLock ? 'You' : (isLockedBySomeone ? 'Someone else' : null)
            });
          }
        } else {
          setIsLocked(false);
          setLockedBy(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchSessions:', error);
    }
  }, [effectiveBranch, selectedFile, currentUserId]);

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
            const hasLock = session.locked_by === currentUserId;
            const isLockedBySomeone = !!session.locked_by;
            
            setIsLocked(isLockedBySomeone);
            setLockedBy(hasLock ? 'You' : (isLockedBySomeone ? 'Someone else' : null));
            
            if (session.content && !hasLock) {
              setLiveContent(session.content);
            }
            
            if (DEBUG_LIVE) {
              console.log('Real-time lock update:', {
                file: selectedFile,
                locked_by: session.locked_by,
                currentUserId,
                hasLock,
                isLockedBySomeone,
                lockedBy: hasLock ? 'You' : (isLockedBySomeone ? 'Someone else' : null)
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscription for branch:', effectiveBranch);
      supabase.removeChannel(channel);
    };
  }, [effectiveBranch, selectedFile, fetchSessions, currentUserId]);

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
    if (!effectiveBranch || !currentUserId) return false;
    
    setIsAcquiringLock(true);
    try {
      const { data, error } = await supabase.rpc('acquire_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
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
  }, [effectiveBranch, currentUserId]);

  // Force take lock function - forcefully acquires lock even if someone else has it
  const takeLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!effectiveBranch || !currentUserId) return false;
    
    setIsAcquiringLock(true);
    try {
      console.log('Force taking lock for file:', filePath);

      // First release any existing lock by directly updating the session
      const { error: updateError } = await supabase
        .from('live_editing_sessions')
        .update({
          locked_by: currentUserId,
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('file_path', filePath)
        .eq('branch_name', effectiveBranch);

      if (updateError) {
        console.error('Error force taking lock:', updateError);
        return false;
      }

      setIsLocked(true);
      setLockedBy('You');
      console.log('Successfully force took lock for:', filePath);
      return true;
    } catch (error) {
      console.error('Error in takeLock:', error);
      return false;
    } finally {
      setIsAcquiringLock(false);
    }
  }, [effectiveBranch, currentUserId]);

  // Release lock function
  const releaseLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!effectiveBranch || !currentUserId) return false;
    
    try {
      const { data, error } = await supabase.rpc('release_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
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
  }, [effectiveBranch, currentUserId]);

  // Enhanced save live content function with better timestamp handling
  const saveLiveContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    if (!effectiveBranch || !currentUserId) return false;
    
    try {
      // Use upsert with explicit timestamp to ensure proper ordering
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          content: content,
          user_id: currentUserId,
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
  }, [effectiveBranch, currentUserId]);

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
        const hasLock = data.locked_by === currentUserId;
        const isLockedBySomeone = !!data.locked_by;
        
        setIsLocked(isLockedBySomeone);
        setLockedBy(hasLock ? 'You' : (isLockedBySomeone ? 'Someone else' : null));
        
        console.log('Loaded live content:', {
          filePath,
          branch: effectiveBranch,
          contentLength: data.content?.length || 0,
          lastUpdated: data.updated_at,
          lockStatus: { hasLock, isLockedBySomeone, lockedBy: hasLock ? 'You' : (isLockedBySomeone ? 'Someone else' : null) }
        });
        return data.content || null;
      }

      return null;
    } catch (error) {
      console.error('Error in loadLiveContent:', error);
      return null;
    }
  }, [effectiveBranch, currentUserId]);

  return {
    isLocked,
    lockedBy,
    liveContent,
    sessions,
    isAcquiringLock,
    acquireLock,
    takeLock,
    releaseLock,
    saveLiveContent,
    loadLiveContent,
  };
}
