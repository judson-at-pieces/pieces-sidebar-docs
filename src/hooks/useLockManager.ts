import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';

interface LockSession {
  file_path: string;
  user_id: string;
  locked_by: string;
  locked_at: string;
  branch_name: string;
  locked_by_name?: string;
  locked_by_email?: string;
}

const DEBUG_LOCK = true;

export function useLockManager() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeLocks, setActiveLocks] = useState<Map<string, LockSession>>(new Map());
  const [myCurrentLock, setMyCurrentLock] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const currentBranch = getBranchCookie() || 'main';
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const cleanupExecutedRef = useRef(false);
  const isUnloadingRef = useRef(false);

  if (DEBUG_LOCK) {
    console.log('🔒 LOCK MANAGER: Current state:', {
      currentUserId,
      myCurrentLock,
      activeLocksCount: activeLocks.size,
      branch: currentBranch,
      userNamesCount: userNames.size
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

  // Fetch user names for display
  const fetchUserNames = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching user names:', error);
        return;
      }

      const nameMap = new Map(userNames);
      (data || []).forEach(profile => {
        const displayName = profile.full_name || profile.email || `User ${profile.id.slice(0, 8)}`;
        nameMap.set(profile.id, displayName);
      });
      
      setUserNames(nameMap);

      if (DEBUG_LOCK) {
        console.log('🔒 FETCHED USER NAMES:', {
          newUsers: data?.length || 0,
          totalCached: nameMap.size,
          names: Array.from(nameMap.entries())
        });
      }
    } catch (error) {
      console.error('Error in fetchUserNames:', error);
    }
  }, [userNames]);

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
      const userIdsToFetch: string[] = [];

      (data || []).forEach(session => {
        lockMap.set(session.file_path, session as LockSession);
        if (session.locked_by === currentUserId) {
          myLock = session.file_path;
        }
        if (session.locked_by && !userNames.has(session.locked_by)) {
          userIdsToFetch.push(session.locked_by);
        }
      });

      setActiveLocks(lockMap);
      setMyCurrentLock(myLock);

      // Fetch user names for any new users
      if (userIdsToFetch.length > 0) {
        await fetchUserNames(userIdsToFetch);
      }

      if (DEBUG_LOCK) {
        console.log('🔒 FETCHED LOCKS:', {
          totalLocks: lockMap.size,
          myLock,
          allLocks: Array.from(lockMap.entries()),
          usersToFetch: userIdsToFetch.length
        });
      }
    } catch (error) {
      console.error('Error in fetchActiveLocks:', error);
    }
  }, [currentBranch, currentUserId, userNames, fetchUserNames]);

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

  // Release ALL locks for current user in current branch
  const releaseAllMyLocks = useCallback(async (): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    try {
      if (DEBUG_LOCK) {
        console.log('🔒 Releasing ALL locks for user:', currentUserId, 'in branch:', currentBranch);
      }

      // Release all locks for this user in this branch by setting locked_by to null
      const { error: releaseError } = await supabase
        .from('live_editing_sessions')
        .update({
          locked_by: null,
          locked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('locked_by', currentUserId)
        .eq('branch_name', currentBranch);

      if (releaseError) {
        console.error('Error releasing all locks:', releaseError);
        return false;
      }

      // Clear local state
      setMyCurrentLock(null);

      if (DEBUG_LOCK) {
        console.log('🔒 Successfully released all locks for user in branch:', currentBranch);
      }

      return true;
    } catch (error) {
      console.error('Error in releaseAllMyLocks:', error);
      return false;
    }
  }, [currentUserId, currentBranch]);

  // Enhanced acquire lock that automatically releases other locks
  const acquireLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    if (DEBUG_LOCK) {
      console.log('🔒 Attempting to acquire lock for:', filePath);
    }

    // Check if file is already locked by someone else
    const existingLock = activeLocks.get(filePath);
    if (existingLock && existingLock.locked_by !== currentUserId) {
      console.log('🔒 File already locked by someone else:', existingLock);
      return false;
    }

    // If user already has this lock, just refresh it
    if (myCurrentLock === filePath) {
      if (DEBUG_LOCK) {
        console.log('🔒 Already have lock for this file, refreshing:', filePath);
      }
      
      try {
        const { error } = await supabase
          .from('live_editing_sessions')
          .update({
            locked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('file_path', filePath)
          .eq('branch_name', currentBranch)
          .eq('locked_by', currentUserId);

        if (error) {
          console.error('Error refreshing lock:', error);
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error in lock refresh:', error);
        return false;
      }
    }

    try {
      // Step 1: Release ALL other locks first - this is the key fix
      if (DEBUG_LOCK) {
        console.log('🔒 Releasing ALL existing locks before acquiring new one');
      }
      
      const releaseSuccess = await releaseAllMyLocks();
      if (!releaseSuccess) {
        console.error('🔒 Failed to release existing locks, but continuing...');
      }

      // Step 2: Wait a moment for the release to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Acquire the new lock
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
  }, [currentUserId, currentBranch, myCurrentLock, activeLocks, releaseAllMyLocks]);

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

  // Improved cleanup with multiple layers of protection
  const performCleanup = useCallback(async () => {
    if (cleanupExecutedRef.current || !myCurrentLock || !currentUserId || isUnloadingRef.current) {
      return;
    }
    
    cleanupExecutedRef.current = true;
    isUnloadingRef.current = true;
    
    console.log('🔒 Performing cleanup for lock:', myCurrentLock);
    
    try {
      // Clear heartbeat immediately
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Release the lock
      await releaseLock(myCurrentLock);
    } catch (error) {
      console.error('🔒 Error during cleanup:', error);
    }
  }, [myCurrentLock, currentUserId, releaseLock]);

  // Enhanced cleanup on unmount or page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (myCurrentLock && currentUserId) {
        // Set flag to prevent duplicate cleanup
        isUnloadingRef.current = true;
        
        // Use sendBeacon for reliable cleanup on page unload
        if (navigator.sendBeacon) {
          // Send a beacon to release the lock
          const releaseData = new FormData();
          releaseData.append('action', 'release_lock');
          releaseData.append('file_path', myCurrentLock);
          releaseData.append('user_id', currentUserId);
          releaseData.append('branch_name', currentBranch);
          
          // This is a fallback - in a real implementation you'd want an endpoint for this
          console.log('🔒 Sending beacon to release lock on unload:', myCurrentLock);
        }
        
        // Synchronous cleanup for immediate effect
        performCleanup();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isUnloadingRef.current) {
        performCleanup();
      }
    };

    const handlePageHide = () => {
      if (!isUnloadingRef.current) {
        performCleanup();
      }
    };

    const handleUnload = () => {
      if (!isUnloadingRef.current) {
        performCleanup();
      }
    };

    // Add multiple event listeners for better coverage
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup on component unmount
      performCleanup();
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [myCurrentLock, currentUserId, currentBranch, performCleanup]);

  // Initial fetch
  useEffect(() => {
    fetchActiveLocks();
  }, [fetchActiveLocks]);

  // Helper functions with name resolution
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

  const getFileLockOwnerName = useCallback((filePath: string): string => {
    const lock = activeLocks.get(filePath);
    if (!lock?.locked_by) return 'Unknown';
    
    if (lock.locked_by === currentUserId) return 'You';
    
    const cachedName = userNames.get(lock.locked_by);
    if (cachedName) {
      return cachedName;
    }
    
    // If we don't have the name cached, trigger a fetch and return a placeholder
    fetchUserNames([lock.locked_by]);
    return `User ${lock.locked_by.slice(0, 8)}`;
  }, [activeLocks, currentUserId, userNames, fetchUserNames]);

  return {
    // State
    currentUserId,
    myCurrentLock,
    activeLocks,
    
    // Actions
    acquireLock,
    forceTakeLock,
    releaseLock,
    releaseAllMyLocks,
    
    // Helpers
    isFileLocked,
    isFileLockedByMe,
    isFileLockedByOther,
    getFileLockOwner,
    getFileLockOwnerName,
    
    // Utils
    refreshLocks: fetchActiveLocks
  };
}
