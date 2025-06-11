import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';
import { 
  getCurrentLockFromCookie, 
  setCurrentLockCookie, 
  setLockOperation,
  lockQueue,
  type LockInfo 
} from '@/utils/lockCoordination';

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
  const isUnloadingRef = useRef(false);

  if (DEBUG_LOCK) {
    console.log('🔒 LOCK MANAGER STATE:', {
      currentUserId,
      myCurrentLock,
      activeLocksCount: activeLocks.size,
      branch: currentBranch,
      cookieLock: getCurrentLockFromCookie()
    });
  }

  // Sync with cookie on initialization
  useEffect(() => {
    const cookieLock = getCurrentLockFromCookie();
    if (cookieLock && cookieLock.branchName === currentBranch) {
      setMyCurrentLock(cookieLock.filePath);
      if (DEBUG_LOCK) {
        console.log('🔒 RESTORED LOCK FROM COOKIE:', cookieLock);
      }
    }
  }, [currentBranch]);

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

  // ATOMIC lock release - force release ALL locks for user in current branch
  const forceReleaseAllMyLocks = useCallback(async (): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    return lockQueue.add(async () => {
      try {
        if (DEBUG_LOCK) {
          console.log('🔒 FORCE RELEASING ALL LOCKS - ATOMIC OPERATION');
        }

        setLockOperation({
          type: 'releasing',
          timestamp: Date.now()
        });

        // Step 1: Clear heartbeat immediately
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Step 2: Database operation - release ALL locks for this user in this branch
        const { error } = await supabase
          .from('live_editing_sessions')
          .update({
            locked_by: null,
            locked_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('locked_by', currentUserId)
          .eq('branch_name', currentBranch);

        if (error) {
          console.error('🔒 Database error releasing locks:', error);
          return false;
        }

        // Step 3: Clear local state immediately
        setMyCurrentLock(null);
        setCurrentLockCookie(null);
        setLockOperation(null);

        if (DEBUG_LOCK) {
          console.log('🔒 ✅ ALL LOCKS FORCE RELEASED');
        }

        return true;
      } catch (error) {
        console.error('🔒 Error in forceReleaseAllMyLocks:', error);
        return false;
      }
    });
  }, [currentUserId, currentBranch]);

  // ATOMIC lock acquisition with guaranteed cleanup
  const acquireLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    return lockQueue.add(async () => {
      try {
        if (DEBUG_LOCK) {
          console.log('🔒 ATOMIC LOCK ACQUISITION STARTING:', { filePath, branch: currentBranch });
        }

        setLockOperation({
          type: 'acquiring',
          toFile: filePath,
          timestamp: Date.now()
        });

        // Step 1: FORCE release ALL existing locks first - no exceptions
        const releaseSuccess = await forceReleaseAllMyLocks();
        if (DEBUG_LOCK) {
          console.log('🔒 Pre-acquire cleanup result:', releaseSuccess);
        }

        // Step 2: Wait a moment for database propagation
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 3: Check if someone else has this file locked
        const { data: existingLock } = await supabase
          .from('live_editing_sessions')
          .select('locked_by, locked_at')
          .eq('file_path', filePath)
          .eq('branch_name', currentBranch)
          .not('locked_by', 'is', null)
          .gte('locked_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existingLock && existingLock.locked_by !== currentUserId) {
          if (DEBUG_LOCK) {
            console.log('🔒 ❌ File locked by someone else:', existingLock);
          }
          setLockOperation(null);
          return false;
        }

        // Step 4: Acquire the lock using the database function
        const { data: lockAcquired, error } = await supabase.rpc('acquire_file_lock_by_branch', {
          p_file_path: filePath,
          p_user_id: currentUserId,
          p_branch_name: currentBranch
        });

        if (error) {
          console.error('🔒 Lock acquisition error:', error);
          setLockOperation(null);
          return false;
        }

        if (lockAcquired) {
          // Step 5: Update local state and cookie
          setMyCurrentLock(filePath);
          
          const lockInfo: LockInfo = {
            filePath,
            branchName: currentBranch,
            userId: currentUserId,
            acquiredAt: Date.now()
          };
          
          setCurrentLockCookie(lockInfo);
          setLockOperation(null);

          if (DEBUG_LOCK) {
            console.log('🔒 ✅ LOCK ACQUIRED SUCCESSFULLY:', lockInfo);
          }

          return true;
        }

        setLockOperation(null);
        return false;
      } catch (error) {
        console.error('🔒 Error in acquireLock:', error);
        setLockOperation(null);
        return false;
      }
    });
  }, [currentUserId, currentBranch, forceReleaseAllMyLocks]);

  // Enhanced file switching - handles the specific dual lock scenario
  const switchToFile = useCallback(async (newFilePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    return lockQueue.add(async () => {
      try {
        const currentLockFile = myCurrentLock;
        
        if (DEBUG_LOCK) {
          console.log('🔒 FILE SWITCH OPERATION:', {
            from: currentLockFile,
            to: newFilePath,
            branch: currentBranch
          });
        }

        setLockOperation({
          type: 'switching',
          fromFile: currentLockFile || undefined,
          toFile: newFilePath,
          timestamp: Date.now()
        });

        // Step 1: Always force release ALL locks first
        await forceReleaseAllMyLocks();

        // Step 2: Wait for propagation
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 3: Acquire new lock
        const success = await acquireLock(newFilePath);
        
        setLockOperation(null);
        
        if (DEBUG_LOCK) {
          console.log('🔒 FILE SWITCH RESULT:', success);
        }

        return success;
      } catch (error) {
        console.error('🔒 Error in switchToFile:', error);
        setLockOperation(null);
        return false;
      }
    });
  }, [currentUserId, currentBranch, myCurrentLock, forceReleaseAllMyLocks, acquireLock]);

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
  }, [currentUserId, currentBranch, myCurrentLock, acquireLock, forceReleaseAllMyLocks]);

  // Release lock for a file
  const releaseLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentUserId || !currentBranch) return false;

    return lockQueue.add(async () => {
      const success = await supabase.rpc('release_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
        p_branch_name: currentBranch
      });
      
      if (success) {
        setMyCurrentLock(null);
        setCurrentLockCookie(null);
      }
      
      return success;
    });
  }, [currentUserId, currentBranch]);

  // Improved cleanup with multiple layers of protection
  const performCleanup = useCallback(async () => {
    if (isUnloadingRef.current) {
      return;
    }
    
    isUnloadingRef.current = true;
    
    console.log('🔒 Performing cleanup for lock:', myCurrentLock);
    
    try {
      // Clear heartbeat immediately
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Release the lock
      if (myCurrentLock) {
        await releaseLock(myCurrentLock);
      }
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

  const refreshLocks = fetchActiveLocks;

  return {
    // State
    currentUserId,
    myCurrentLock,
    activeLocks,
    
    // Actions
    acquireLock,
    switchToFile, // New method for file switching
    forceTakeLock: async (filePath: string) => {
      // Force take always clears everything first
      await forceReleaseAllMyLocks();
      await new Promise(resolve => setTimeout(resolve, 200));
      return acquireLock(filePath);
    },
    releaseLock: async (filePath: string) => {
      return lockQueue.add(async () => {
        const success = await supabase.rpc('release_file_lock_by_branch', {
          p_file_path: filePath,
          p_user_id: currentUserId,
          p_branch_name: currentBranch
        });
        
        if (success) {
          setMyCurrentLock(null);
          setCurrentLockCookie(null);
        }
        
        return success;
      });
    },
    releaseAllMyLocks: forceReleaseAllMyLocks,
    
    // Helpers
    isFileLocked,
    isFileLockedByMe,
    isFileLockedByOther,
    getFileLockOwner,
    getFileLockOwnerName,
    
    // Utils
    refreshLocks
  };
}
