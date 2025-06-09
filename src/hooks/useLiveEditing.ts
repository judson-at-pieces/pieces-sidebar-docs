
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LiveEditingSession {
  file_path: string;
  content: string;
  locked_by_email?: string;
  locked_by_name?: string;
  locked_at?: string;
  updated_at: string;
}

export function useLiveEditing(filePath?: string) {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<string>('');
  const [sessions, setSessions] = useState<LiveEditingSession[]>([]);
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);

  // Fetch all live editing sessions
  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_live_editing_sessions');
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching live editing sessions:', error);
    }
  }, []);

  // Acquire lock on a file
  const acquireLock = useCallback(async (filePathToLock: string) => {
    if (!user?.id) return false;
    
    setIsAcquiringLock(true);
    try {
      const { data, error } = await supabase.rpc('acquire_file_lock', {
        p_file_path: filePathToLock,
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      if (data) {
        setIsLocked(true);
        setLockedBy('You');
        return true;
      } else {
        setIsLocked(false);
        setLockedBy('Another user');
        return false;
      }
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    } finally {
      setIsAcquiringLock(false);
    }
  }, [user]);

  // Release lock on a file
  const releaseLock = useCallback(async (filePathToRelease: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase.rpc('release_file_lock', {
        p_file_path: filePathToRelease,
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      setIsLocked(false);
      setLockedBy(null);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }, [user]);

  // Save live content
  const saveLiveContent = useCallback(async (filePathToSave: string, content: string) => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase.rpc('save_live_content', {
        p_file_path: filePathToSave,
        p_content: content,
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      if (data) {
        setLiveContent(content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving live content:', error);
      return false;
    }
  }, [user]);

  // Load live content for a file
  const loadLiveContent = useCallback(async (filePathToLoad: string) => {
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content, locked_by')
        .eq('file_path', filePathToLoad)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setLiveContent(data.content);
        return data.content;
      }
      return null;
    } catch (error) {
      console.error('Error loading live content:', error);
      return null;
    }
  }, []);

  // Check if current user has lock on file
  const checkLockStatus = useCallback(async (filePathToCheck: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('locked_by, locked_at')
        .eq('file_path', filePathToCheck)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.locked_by) {
        const isLockedByCurrentUser = data.locked_by === user.id;
        setIsLocked(isLockedByCurrentUser);
        setLockedBy(isLockedByCurrentUser ? 'You' : 'Another user');
      } else {
        setIsLocked(false);
        setLockedBy(null);
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  }, [user]);

  // Set up real-time subscription for live editing sessions
  useEffect(() => {
    fetchSessions();
    
    const channel = supabase
      .channel('live-editing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions'
        },
        (payload) => {
          console.log('Live editing session changed:', payload);
          fetchSessions();
          
          // If someone else acquired a lock on the current file, update status
          if (filePath && payload.new && payload.new.file_path === filePath) {
            if (payload.new.locked_by && payload.new.locked_by !== user?.id) {
              setIsLocked(false);
              setLockedBy('Another user');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions, filePath, user?.id]);

  // Check lock status when file path changes
  useEffect(() => {
    if (filePath) {
      checkLockStatus(filePath);
      loadLiveContent(filePath);
    }
  }, [filePath, checkLockStatus, loadLiveContent]);

  // Auto-release lock when component unmounts or user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (filePath && isLocked) {
        releaseLock(filePath);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (filePath && isLocked) {
        releaseLock(filePath);
      }
    };
  }, [filePath, isLocked, releaseLock]);

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
    checkLockStatus
  };
}
