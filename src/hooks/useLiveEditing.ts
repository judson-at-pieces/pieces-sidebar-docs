
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LiveEditingSession {
  file_path: string;
  content: string;
  locked_by_email: string | null;
  locked_by_name: string | null;
  locked_at: string | null;
  updated_at: string;
  branch_name?: string;
}

export function useLiveEditing(selectedFile?: string, currentBranch?: string) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<string>('');
  const [sessions, setSessions] = useState<LiveEditingSession[]>([]);
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);

  // Always use currentBranch or fallback to 'main' for consistency
  const activeBranch = currentBranch || 'main';

  console.log('useLiveEditing initialized with branch:', activeBranch, 'selectedFile:', selectedFile);

  // Fetch all live editing sessions for current branch
  const fetchSessions = useCallback(async () => {
    if (!activeBranch) return;

    try {
      const { data, error } = await supabase
        .rpc('get_live_editing_sessions_by_branch', { 
          branch_name: activeBranch 
        });

      if (error) {
        console.error('Error fetching live editing sessions:', error);
        return;
      }

      console.log('Fetched live editing sessions for branch', activeBranch, ':', data?.length || 0);
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching live editing sessions:', error);
    }
  }, [activeBranch]);

  // Check lock status for the selected file on the current branch
  const checkLockStatus = useCallback(async () => {
    if (!selectedFile || !activeBranch) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Checking lock status for file:', selectedFile, 'on branch:', activeBranch);

      // Query the live editing sessions table directly for this specific branch
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('locked_by, locked_at, content, branch_name, user_id')
        .eq('file_path', selectedFile)
        .eq('branch_name', activeBranch)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking lock status:', error);
        return;
      }

      if (data) {
        const isFileLockedByMe = data.locked_by === user.id;
        const isFileLocked = !!data.locked_by && !!data.locked_at;
        
        // Check if lock is still valid (within 30 minutes)
        const lockTime = data.locked_at ? new Date(data.locked_at) : null;
        const isLockValid = lockTime && (Date.now() - lockTime.getTime()) < 30 * 60 * 1000;

        console.log('Lock status check result:', {
          isFileLocked,
          isLockValid,
          isFileLockedByMe,
          branch: data.branch_name
        });

        setIsLocked(isFileLocked && isLockValid);
        
        if (isFileLocked && isLockValid) {
          if (isFileLockedByMe) {
            setLockedBy('You');
          } else {
            // Get profile info separately to avoid relationship error
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', data.locked_by)
              .maybeSingle();
            
            setLockedBy(profileData?.full_name || profileData?.email || 'Unknown User');
          }
        } else {
          setLockedBy(null);
        }

        // Set live content if available
        if (data.content) {
          setLiveContent(data.content);
        }
      } else {
        console.log('No existing lock/session found for file:', selectedFile, 'on branch:', activeBranch);
        setIsLocked(false);
        setLockedBy(null);
        setLiveContent('');
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  }, [selectedFile, activeBranch]);

  // CRITICAL: Create/Update live editing session entries when branch changes
  const updateSessionsForBranch = useCallback(async (branchName: string) => {
    if (!branchName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('=== UPDATING SESSIONS FOR BRANCH ===', branchName);

      // Get all existing sessions that might need branch updates
      const { data: existingSessions } = await supabase
        .from('live_editing_sessions')
        .select('id, file_path, content, branch_name')
        .eq('user_id', user.id);

      if (existingSessions) {
        console.log('Found existing sessions:', existingSessions.length);
        
        // Update or create sessions for the new branch
        for (const session of existingSessions) {
          // Check if we already have a session for this file on this branch
          const { data: branchSession } = await supabase
            .from('live_editing_sessions')
            .select('id')
            .eq('file_path', session.file_path)
            .eq('branch_name', branchName)
            .maybeSingle();

          if (!branchSession) {
            // Create new session for this branch
            console.log('Creating session for', session.file_path, 'on branch', branchName);
            const { error } = await supabase
              .from('live_editing_sessions')
              .insert({
                file_path: session.file_path,
                content: session.content || '',
                user_id: user.id,
                branch_name: branchName,
                locked_by: null,
                locked_at: null
              });

            if (error) {
              console.error('Error creating session for branch:', error);
            } else {
              console.log('Successfully created session for branch:', branchName);
            }
          } else {
            console.log('Session already exists for', session.file_path, 'on branch', branchName);
          }
        }
      }

      // Force refresh sessions
      await fetchSessions();
      
    } catch (error) {
      console.error('Error updating sessions for branch:', error);
    }
  }, [fetchSessions]);

  // Acquire lock for a file on the current branch
  const acquireLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!activeBranch) {
      toast.error('No branch selected');
      return false;
    }

    setIsAcquiringLock(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to edit files');
        return false;
      }

      console.log('Acquiring lock for file:', filePath, 'on branch:', activeBranch);

      const { data, error } = await supabase
        .rpc('acquire_file_lock_by_branch', { 
          p_file_path: filePath, 
          p_user_id: user.id,
          p_branch_name: activeBranch
        });

      if (error) {
        console.error('Error acquiring lock:', error);
        toast.error('Failed to acquire editing lock');
        return false;
      }

      if (data) {
        console.log('Successfully acquired lock for:', filePath, 'on branch:', activeBranch);
        setIsLocked(true);
        setLockedBy('You');
        toast.success('You can now edit this file');
        await fetchSessions();
        return true;
      } else {
        toast.error('File is currently being edited by someone else');
        return false;
      }
    } catch (error) {
      console.error('Error acquiring lock:', error);
      toast.error('Failed to acquire editing lock');
      return false;
    } finally {
      setIsAcquiringLock(false);
    }
  }, [activeBranch, fetchSessions]);

  // Release lock for a file on the current branch
  const releaseLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!activeBranch) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log('Releasing lock for file:', filePath, 'on branch:', activeBranch);

      const { data, error } = await supabase
        .rpc('release_file_lock_by_branch', { 
          p_file_path: filePath, 
          p_user_id: user.id,
          p_branch_name: activeBranch
        });

      if (error) {
        console.error('Error releasing lock:', error);
        return false;
      }

      if (data) {
        console.log('Successfully released lock for:', filePath, 'on branch:', activeBranch);
        setIsLocked(false);
        setLockedBy(null);
        await fetchSessions();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }, [activeBranch, fetchSessions]);

  // Save live content for a file on the current branch
  const saveLiveContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    if (!activeBranch) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log('Saving live content for file:', filePath, 'on branch:', activeBranch);

      const { data, error } = await supabase
        .rpc('save_live_content_by_branch', { 
          p_file_path: filePath, 
          p_content: content, 
          p_user_id: user.id,
          p_branch_name: activeBranch
        });

      if (error) {
        console.error('Error saving live content:', error);
        return false;
      }

      if (data) {
        setLiveContent(content);
        await fetchSessions();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving live content:', error);
      return false;
    }
  }, [activeBranch, fetchSessions]);

  // Load live content for a file on the current branch
  const loadLiveContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!activeBranch) return null;

    try {
      console.log('Loading live content for file:', filePath, 'on branch:', activeBranch);

      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', activeBranch)
        .maybeSingle();

      if (error) {
        console.error('Error loading live content:', error);
        return null;
      }

      console.log('Loaded live content result:', data?.content ? 'Found content' : 'No content');
      return data?.content || null;
    } catch (error) {
      console.error('Error loading live content:', error);
      return null;
    }
  }, [activeBranch]);

  // Set up real-time subscription for live editing sessions on the current branch
  useEffect(() => {
    if (!activeBranch) return;

    console.log('Setting up real-time subscription for branch:', activeBranch);

    const channel = supabase
      .channel(`live_editing_sessions_${activeBranch}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions',
          filter: `branch_name=eq.${activeBranch}`
        },
        (payload) => {
          console.log('Real-time update received for branch:', activeBranch, payload);
          fetchSessions();
          if (selectedFile) {
            checkLockStatus();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for branch:', activeBranch);
      supabase.removeChannel(channel);
    };
  }, [activeBranch, selectedFile, fetchSessions, checkLockStatus]);

  // CRITICAL: When branch changes, update sessions and fetch new data
  useEffect(() => {
    if (activeBranch) {
      console.log('=== BRANCH EFFECT TRIGGERED ===', activeBranch);
      
      // First, update any existing sessions to the new branch
      updateSessionsForBranch(activeBranch);
      
      // Then fetch sessions for this branch
      fetchSessions();
      
      // If we have a selected file, check its lock status
      if (selectedFile) {
        checkLockStatus();
      }
    }
  }, [activeBranch, updateSessionsForBranch, fetchSessions, checkLockStatus, selectedFile]);

  // Clear state when branch changes - IMPORTANT: This ensures clean state
  useEffect(() => {
    console.log('Clearing live editing state for branch change to:', activeBranch);
    setIsLocked(false);
    setLockedBy(null);
    setLiveContent('');
    // Don't clear sessions here - let updateSessionsForBranch handle it
  }, [activeBranch]);

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
