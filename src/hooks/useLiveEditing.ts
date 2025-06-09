
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

  // Use 'main' as fallback if no branch is provided
  const activeBranch = currentBranch || 'main';

  console.log('useLiveEditing hook - currentBranch:', currentBranch, 'activeBranch:', activeBranch);

  // Fetch all live editing sessions for current branch
  const fetchSessions = useCallback(async () => {
    if (!activeBranch) return;

    try {
      console.log('Fetching sessions for branch:', activeBranch);
      
      const { data, error } = await supabase
        .rpc('get_live_editing_sessions_by_branch', { 
          branch_name: activeBranch 
        });

      if (error) {
        console.error('Error fetching live editing sessions:', error);
        return;
      }

      console.log('Fetched sessions:', data?.length || 0, 'for branch:', activeBranch);
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching live editing sessions:', error);
    }
  }, [activeBranch]);

  // Check lock status for the selected file
  const checkLockStatus = useCallback(async () => {
    if (!selectedFile || !activeBranch) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Checking lock status for file:', selectedFile, 'on branch:', activeBranch);

      // Query the live editing sessions table directly and then join with profiles
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select(`
          locked_by, 
          locked_at, 
          content,
          profiles!inner(email, full_name)
        `)
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

        setIsLocked(isFileLocked && isLockValid);
        
        if (isFileLocked && isLockValid) {
          if (isFileLockedByMe) {
            setLockedBy('You');
          } else {
            const profile = data.profiles;
            setLockedBy(profile?.full_name || profile?.email || 'Unknown User');
          }
        } else {
          setLockedBy(null);
        }

        // Set live content if available
        if (data.content) {
          setLiveContent(data.content);
        }
      } else {
        setIsLocked(false);
        setLockedBy(null);
        setLiveContent('');
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  }, [selectedFile, activeBranch]);

  // Acquire lock for a file
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

  // Release lock for a file
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

  // Save live content for a file
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

  // Load live content for a file
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

      console.log('Loaded live content length:', data?.content?.length || 0, 'for file:', filePath, 'on branch:', activeBranch);
      return data?.content || null;
    } catch (error) {
      console.error('Error loading live content:', error);
      return null;
    }
  }, [activeBranch]);

  // Clear state when branch changes
  useEffect(() => {
    console.log('Branch changed to:', activeBranch);
    setIsLocked(false);
    setLockedBy(null);
    setLiveContent('');
    setSessions([]);
  }, [activeBranch]);

  // Set up real-time subscription for live editing sessions
  useEffect(() => {
    if (!activeBranch) return;

    console.log('Setting up realtime subscription for branch:', activeBranch);

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
          console.log('Live editing session update for branch:', activeBranch, payload);
          fetchSessions();
          if (selectedFile) {
            checkLockStatus();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for branch:', activeBranch);
      supabase.removeChannel(channel);
    };
  }, [activeBranch, selectedFile, fetchSessions, checkLockStatus]);

  // Fetch sessions and check lock status when file or branch changes
  useEffect(() => {
    if (activeBranch) {
      fetchSessions();
    }
    if (selectedFile && activeBranch) {
      checkLockStatus();
    }
  }, [selectedFile, activeBranch, fetchSessions, checkLockStatus]);

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
