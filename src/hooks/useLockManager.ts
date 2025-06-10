
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';

interface LockSession {
  file_path: string;
  user_id: string;
  locked_by: string;
  locked_at: string;
  branch_name: string;
}

const DEBUG_LOCK = true;

export function useLockManager() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeLocks, setActiveLocks] = useState<Map<string, LockSession>>(new Map());
  const [myCurrentLock, setMyCurrentLock] = useState<string | null>(null);
  const currentBranch = getBranchCookie() || 'main';
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const cleanupExecutedRef = useRef(false);

  if (DEBUG_LOCK) {
    console.log('🔒 LOCK MANAGER: Current state:', {
      currentUserId,
      myCurrentLock,
      activeLocksCount: activeLocks.size,
      branch: currentBranch
    });
  }

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch all active locks for current branch
  const fetchActiveLocks = useCallback(async () => {
    if (!currentBranch) return;
    
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, user_id, locked_by, locked_at, branch_name')
        .eq('branch_name', currentBranch)
        .not('locked_by', 'is', null)
        .gte('locked_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active locks within 30 minutes

      if (error) {
        console.error('Error fetching active locks:', error);
        return;
      }

      const lockMap = new Map<string, LockSession>();
      let myLock: string | null = null;

      (data || []).forEach(session => {
        lockMap.set(session.file_path, session as LockSession);
        if (session.locked_by === currentUserId) {
          myLock = session.file_path;
        }
      });

      setActiveLocks(lockMap);
      setMyCurrentLock(myLock);

      if (DEBUG_LOCK) {
        console.log('🔒 FETCHED LOCKS:', {
          totalLocks: lockMap.size,
          myLock,
          allLocks: Array.from(lockMap.entries())
        });
      }
    } catch (error) {
      console.error('Error in fetchActiveLocks:', error);
    }
  }, [currentBranch, currentUserId]);

  // Setup real-time subscription for locks
  useEffect(() => {
    if (!currentBranch) return;
    
    console.log('🔒 Setting up lock subscription for branch:', currentBranch);
    
    const channel = supabase
      .channel(`locks_${currentBranch}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions',
          filter: `branch_name=eq.${currentBranch}`
        },
        (payload) => {
          console.log('🔒 Lock update received:', payload);
          fetchActiveLocks();
        }
      )
      .subscribe();

    return () => {
      console.log('🔒 Cleaning up lock subscription');
      supabase.removeChannel(channel);
    };
  }, [currentBranch, fetchActiveLocks]);

  // Heartbeat to maintain active lock
  useEffect(() => {
    if (!myCurrentLock || !currentUserId) return;

    const sendHeartbeat = async () => {
      try {
        const { error } = await supabase
          .from('live_editing_sessions')
          .update({
            locked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('file_path', myCurrentLock)
          .eq('branch_name', currentBranch)
          .eq('locked_by', currentUserId);

        if (error) {
          console.error('Error sending heartbeat:', error);
        } else if (DEBUG_LOCK) {
          console.log('🔒 Heartbeat sent for:', myCurrentLock);
        }
      } catch (error) {
        console.error('Error in heartbeat:', error);
      }
    };

    // Send heartbeat every 10 seconds
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 10000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [myCurrentLock, currentUserId, currentBranch]);

  // Acquire lock for a file
  const acquireLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    // If user already has a lock on a different file, release it first
    if (myCurrentLock && myCurrentLock !== filePath) {
      await releaseLock(myCurrentLock);
    }

    // Check if file is already locked by someone else
    const existingLock = activeLocks.get(filePath);
    if (existingLock && existingLock.locked_by !== currentUserId) {
      console.log('🔒 File already locked by someone else:', existingLock);
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('acquire_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
        p_branch_name: currentBranch
      });

      if (error) {
        console.error('Error acquiring lock:', error);
        return false;
      }

      if (data) {
        setMyCurrentLock(filePath);
        if (DEBUG_LOCK) {
          console.log('🔒 Lock acquired successfully for:', filePath);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in acquireLock:', error);
      return false;
    }
  }, [currentUserId, currentBranch, myCurrentLock, activeLocks]);

  // Force take lock from another user
  const forceTakeLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    // If user already has a lock on a different file, release it first
    if (myCurrentLock && myCurrentLock !== filePath) {
      await releaseLock(myCurrentLock);
    }

    try {
      const { error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          branch_name: currentBranch,
          user_id: currentUserId,
          locked_by: currentUserId,
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          content: '' // Initialize with empty content
        }, {
          onConflict: 'file_path,branch_name'
        });

      if (error) {
        console.error('Error force taking lock:', error);
        return false;
      }

      setMyCurrentLock(filePath);
      if (DEBUG_LOCK) {
        console.log('🔒 Lock force taken successfully for:', filePath);
      }
      return true;
    } catch (error) {
      console.error('Error in forceTakeLock:', error);
      return false;
    }
  }, [currentUserId, currentBranch, myCurrentLock]);

  // Release lock for a file
  const releaseLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    try {
      const { data, error } = await supabase.rpc('release_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
        p_branch_name: currentBranch
      });

      if (error) {
        console.error('Error releasing lock:', error);
        return false;
      }

      if (myCurrentLock === filePath) {
        setMyCurrentLock(null);
      }

      if (DEBUG_LOCK) {
        console.log('🔒 Lock released successfully for:', filePath);
      }
      return true;
    } catch (error) {
      console.error('Error in releaseLock:', error);
      return false;
    }
  }, [currentUserId, currentBranch, myCurrentLock]);

  // Cleanup all locks on unmount or page unload
  useEffect(() => {
    const cleanup = async () => {
      if (cleanupExecutedRef.current || !myCurrentLock || !currentUserId) return;
      
      cleanupExecutedRef.current = true;
      console.log('🔒 Cleaning up lock on unmount:', myCurrentLock);
      await releaseLock(myCurrentLock);
    };

    const handleBeforeUnload = () => {
      cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanup();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [myCurrentLock, currentUserId, releaseLock]);

  // Initial fetch
  useEffect(() => {
    fetchActiveLocks();
  }, [fetchActiveLocks]);

  // Helper functions
  const isFileLocked = useCallback((filePath: string): boolean => {
    return activeLocks.has(filePath);
  }, [activeLocks]);

  const isFileLockedByMe = useCallback((filePath: string): boolean => {
    const lock = activeLocks.get(filePath);
    return lock?.locked_by === currentUserId;
  }, [activeLocks, currentUserId]);

  const isFileLockedByOther = useCallback((filePath: string): boolean => {
    const lock = activeLocks.get(filePath);
    return lock && lock.locked_by !== currentUserId;
  }, [activeLocks, currentUserId]);

  const getFileLockOwner = useCallback((filePath: string): string | null => {
    return activeLocks.get(filePath)?.locked_by || null;
  }, [activeLocks]);

  return {
    // State
    currentUserId,
    myCurrentLock,
    activeLocks,
    
    // Actions
    acquireLock,
    forceTakeLock,
    releaseLock,
    
    // Helpers
    isFileLocked,
    isFileLockedByMe,
    isFileLockedByOther,
    getFileLockOwner,
    
    // Utils
    refreshLocks: fetchActiveLocks
  };
}
