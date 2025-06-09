
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

  // Fetch all live editing sessions for current branch
  const fetchSessions = useCallback(async () => {
    if (!currentBranch) return;

    try {
      const { data, error } = await supabase
        .rpc('get_live_editing_sessions_by_branch', { 
          branch_name: currentBranch 
        });

      if (error) {
        console.error('Error fetching live editing sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching live editing sessions:', error);
    }
  }, [currentBranch]);

  // Check lock status for the selected file
  const checkLockStatus = useCallback(async () => {
    if (!selectedFile || !currentBranch) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .eq('branch_name', currentBranch || 'main')
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
  }, [selectedFile, currentBranch]);

  // Acquire lock for a file
  const acquireLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentBranch) {
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

      const { data, error } = await supabase
        .rpc('acquire_file_lock_by_branch', { 
          p_file_path: filePath, 
          p_user_id: user.id,
          p_branch_name: currentBranch
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
  }, [currentBranch, fetchSessions]);

  // Release lock for a file
  const releaseLock = useCallback(async (filePath: string): Promise<boolean> => {
    if (!currentBranch) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .rpc('release_file_lock_by_branch', { 
          p_file_path: filePath, 
          p_user_id: user.id,
          p_branch_name: currentBranch
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
  }, [currentBranch, fetchSessions]);

  // Save live content for a file
  const saveLiveContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    if (!currentBranch) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .rpc('save_live_content_by_branch', { 
          p_file_path: filePath, 
          p_content: content, 
          p_user_id: user.id,
          p_branch_name: currentBranch
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
  }, [currentBranch, fetchSessions]);

  // Load live content for a file
  const loadLiveContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!currentBranch) return null;

    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', currentBranch)
        .maybeSingle();

      if (error) {
        console.error('Error loading live content:', error);
        return null;
      }

      return data?.content || null;
    } catch (error) {
      console.error('Error loading live content:', error);
      return null;
    }
  }, [currentBranch]);

  // Set up real-time subscription for live editing sessions
  useEffect(() => {
    if (!currentBranch) return;

    const channel = supabase
      .channel('live_editing_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions',
          filter: `branch_name=eq.${currentBranch}`
        },
        () => {
          fetchSessions();
          if (selectedFile) {
            checkLockStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBranch, selectedFile, fetchSessions, checkLockStatus]);

  // Fetch sessions and check lock status when file or branch changes
  useEffect(() => {
    if (currentBranch) {
      fetchSessions();
    }
    if (selectedFile && currentBranch) {
      checkLockStatus();
    }
  }, [selectedFile, currentBranch, fetchSessions, checkLockStatus]);

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
