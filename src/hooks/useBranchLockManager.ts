
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface BranchLock {
  file_path: string;
  branch_name: string;
  locked_by: string;
  locked_at: string;
  user_name?: string;
}

const DEBUG_LOCK = true;

export function useBranchLockManager() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeLocks, setActiveLocks] = useState<Map<string, BranchLock>>(new Map());
  const [myCurrentLock, setMyCurrentLock] = useState<{ filePath: string; branch: string } | null>(null);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        logger.error('Error getting current user', { error });
        setCurrentUserId(null);
      }
    };
    getCurrentUser();
  }, []);

  // Create a unique key for file+branch combination
  const getLockKey = useCallback((filePath: string, branchName: string) => {
    return `${filePath}:${branchName}`;
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
        logger.error('Error fetching user names', { error, userIds });
        return;
      }

      const nameMap = new Map(userNames);
      (data || []).forEach(profile => {
        const displayName = profile.full_name || profile.email || `User ${profile.id.slice(0, 8)}`;
        nameMap.set(profile.id, displayName);
      });
      
      setUserNames(nameMap);
    } catch (error) {
      console.error('Error in fetchUserNames:', error);
      logger.error('Exception in fetchUserNames', { error, userIds });
    }
  }, [userNames]);

  // Fetch active locks for a specific branch
  const fetchActiveLocksForBranch = useCallback(async (branchName: string) => {
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, branch_name, locked_by, locked_at')
        .eq('branch_name', branchName)
        .not('locked_by', 'is', null)
        .gte('locked_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching locks:', error);
        logger.error('Error fetching active locks', { error, branchName });
        return;
      }

      const lockMap = new Map<string, BranchLock>();
      const userIdsToFetch: string[] = [];

      (data || []).forEach(session => {
        const lockKey = getLockKey(session.file_path, session.branch_name);
        lockMap.set(lockKey, {
          file_path: session.file_path,
          branch_name: session.branch_name,
          locked_by: session.locked_by,
          locked_at: session.locked_at
        });

        if (session.locked_by === currentUserId) {
          setMyCurrentLock({
            filePath: session.file_path,
            branch: session.branch_name
          });
        }

        if (session.locked_by && !userNames.has(session.locked_by)) {
          userIdsToFetch.push(session.locked_by);
        }
      });

      setActiveLocks(lockMap);

      if (userIdsToFetch.length > 0) {
        await fetchUserNames(userIdsToFetch);
      }

      if (DEBUG_LOCK) {
        console.log('🔒 Fetched locks for branch:', branchName, 'Count:', lockMap.size);
      }
    } catch (error) {
      console.error('Error in fetchActiveLocksForBranch:', error);
      logger.error('Exception in fetchActiveLocksForBranch', { error, branchName });
    }
  }, [currentUserId, userNames, fetchUserNames, getLockKey]);

  // Acquire lock for a file on a specific branch
  const acquireLock = useCallback(async (filePath: string, branchName: string): Promise<boolean> => {
    if (!currentUserId) {
      logger.warn('Attempted to acquire lock without user authentication', { filePath, branchName });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('acquire_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
        p_branch_name: branchName
      });

      if (error) {
        console.error('Error acquiring lock:', error);
        logger.error('Error acquiring file lock', { error, filePath, branchName, userId: currentUserId });
        return false;
      }

      if (data) {
        setMyCurrentLock({ filePath, branch: branchName });
        
        // Update local state
        const lockKey = getLockKey(filePath, branchName);
        setActiveLocks(prev => {
          const newMap = new Map(prev);
          newMap.set(lockKey, {
            file_path: filePath,
            branch_name: branchName,
            locked_by: currentUserId,
            locked_at: new Date().toISOString()
          });
          return newMap;
        });

        if (DEBUG_LOCK) {
          console.log('🔒 Lock acquired for:', filePath, 'on branch:', branchName);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in acquireLock:', error);
      logger.error('Exception in acquireLock', { error, filePath, branchName, userId: currentUserId });
      return false;
    }
  }, [currentUserId, getLockKey]);

  // Release lock
  const releaseLock = useCallback(async (filePath: string, branchName: string): Promise<boolean> => {
    if (!currentUserId) {
      logger.warn('Attempted to release lock without user authentication', { filePath, branchName });
      return false;
    }

    try {
      const { error } = await supabase.rpc('release_file_lock_by_branch', {
        p_file_path: filePath,
        p_user_id: currentUserId,
        p_branch_name: branchName
      });

      if (error) {
        console.error('Error releasing lock:', error);
        logger.error('Error releasing file lock', { error, filePath, branchName, userId: currentUserId });
        return false;
      }

      // Update local state
      if (myCurrentLock?.filePath === filePath && myCurrentLock?.branch === branchName) {
        setMyCurrentLock(null);
      }

      const lockKey = getLockKey(filePath, branchName);
      setActiveLocks(prev => {
        const newMap = new Map(prev);
        newMap.delete(lockKey);
        return newMap;
      });

      if (DEBUG_LOCK) {
        console.log('🔒 Lock released for:', filePath, 'on branch:', branchName);
      }
      return true;
    } catch (error) {
      console.error('Error in releaseLock:', error);
      logger.error('Exception in releaseLock', { error, filePath, branchName, userId: currentUserId });
      return false;
    }
  }, [currentUserId, myCurrentLock, getLockKey]);

  // Heartbeat to maintain lock
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
          .eq('file_path', myCurrentLock.filePath)
          .eq('branch_name', myCurrentLock.branch)
          .eq('locked_by', currentUserId);

        if (error) {
          console.error('Error sending heartbeat:', error);
          logger.error('Error sending lock heartbeat', { 
            error, 
            filePath: myCurrentLock.filePath, 
            branch: myCurrentLock.branch 
          });
        } else if (DEBUG_LOCK) {
          console.log('🔒 Heartbeat sent for:', myCurrentLock.filePath, 'on', myCurrentLock.branch);
        }
      } catch (error) {
        console.error('Error in heartbeat:', error);
        logger.error('Exception in lock heartbeat', { 
          error, 
          filePath: myCurrentLock.filePath, 
          branch: myCurrentLock.branch 
        });
      }
    };

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 10000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [myCurrentLock, currentUserId]);

  // Helper functions
  const isFileLocked = useCallback((filePath: string, branchName: string): boolean => {
    const lockKey = getLockKey(filePath, branchName);
    return activeLocks.has(lockKey);
  }, [activeLocks, getLockKey]);

  const isFileLockedByMe = useCallback((filePath: string, branchName: string): boolean => {
    const lockKey = getLockKey(filePath, branchName);
    const lock = activeLocks.get(lockKey);
    return lock?.locked_by === currentUserId;
  }, [activeLocks, currentUserId, getLockKey]);

  const getFileLockOwnerName = useCallback((filePath: string, branchName: string): string => {
    const lockKey = getLockKey(filePath, branchName);
    const lock = activeLocks.get(lockKey);
    if (!lock?.locked_by) return 'Unknown';
    
    if (lock.locked_by === currentUserId) return 'You';
    
    const cachedName = userNames.get(lock.locked_by);
    if (cachedName) return cachedName;
    
    fetchUserNames([lock.locked_by]);
    return `User ${lock.locked_by.slice(0, 8)}`;
  }, [activeLocks, currentUserId, userNames, fetchUserNames, getLockKey]);

  return {
    currentUserId,
    myCurrentLock,
    acquireLock,
    releaseLock,
    isFileLocked,
    isFileLockedByMe,
    getFileLockOwnerName,
    fetchActiveLocksForBranch
  };
}
