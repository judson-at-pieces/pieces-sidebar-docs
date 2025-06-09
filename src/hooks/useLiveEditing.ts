
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

  // Use currentBranch with proper fallback
  const activeBranch = currentBranch || 'main';

  console.log('useLiveEditing: activeBranch =', activeBranch, 'selectedFile =', selectedFile);

  // Fetch live editing sessions for the current branch
  const fetchSessions = useCallback(async () => {
    if (!activeBranch) return;

    try {
      console.log('Fetching sessions for branch:', activeBranch);
      
      // Get all sessions for this branch with content
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content, locked_by, locked_at, updated_at, branch_name, user_id')
        .eq('branch_name', activeBranch)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching live editing sessions:', error);
        return;
      }

      // Transform the data to match the expected interface
      const transformedSessions: LiveEditingSession[] = (data || []).map(session => ({
        file_path: session.file_path,
        content: session.content || '',
        locked_by_email: null, // We'll get this from profiles if needed
        locked_by_name: null,  // We'll get this from profiles if needed
        locked_at: session.locked_at,
        updated_at: session.updated_at,
        branch_name: session.branch_name
      }));

      console.log('Found', transformedSessions.length, 'sessions with content for branch:', activeBranch);
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching live editing sessions:', error);
    }
  }, [activeBranch]);

  // Check lock status for the selected file
  const checkLockStatus = useCallback(async () => {
    if (!selectedFile || !activeBranch) {
      setIsLocked(false);
      setLockedBy(null);
      setLiveContent('');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Checking lock for file:', selectedFile, 'on branch:', activeBranch);

      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('locked_by, locked_at, content, user_id')
        .eq('file_path', selectedFile)
        .eq('branch_name', activeBranch)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
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
            // Get user profile info
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
        console.log('Successfully acquired lock for:', filePath);
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
        console.log('Successfully released lock for:', filePath);
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

      return data?.content || null;
    } catch (error) {
      console.error('Error loading live content:', error);
      return null;
    }
  }, [activeBranch]);

  // Set up real-time subscription
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
          console.log('Real-time update for branch:', activeBranch, payload);
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

  // Fetch sessions when branch changes
  useEffect(() => {
    if (activeBranch) {
      fetchSessions();
    }
  }, [activeBranch, fetchSessions]);

  // Check lock status when file or branch changes
  useEffect(() => {
    checkLockStatus();
  }, [selectedFile, activeBranch, checkLockStatus]);

  // Clear state when branch changes
  useEffect(() => {
    console.log('Clearing live editing state for branch:', activeBranch);
    setIsLocked(false);
    setLockedBy(null);
    setLiveContent('');
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
