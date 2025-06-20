
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingSession {
  file_path: string;
  user_id: string;
  content: string;
  cursor_position: number;
  updated_at: string;
}

export function useLiveTyping(filePath?: string) {
  const { user } = useAuth();
  const [typingSessions, setTypingSessions] = useState<TypingSession[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSentContentRef = useRef<string>('');
  const cleanupExecutedRef = useRef<boolean>(false);

  // Send typing event to webhook
  const sendTypingEvent = useCallback(async (content: string, cursorPosition: number) => {
    if (!user?.id || !filePath) {
      console.log('No user or filePath, skipping typing event');
      return;
    }

    // Avoid sending the same content repeatedly
    if (content === lastSentContentRef.current) {
      return;
    }

    try {
      console.log('Sending typing event:', { filePath, contentLength: content.length, cursorPosition });
      
      const { data, error } = await supabase.functions.invoke('live-typing', {
        body: {
          file_path: filePath,
          user_id: user.id,
          content,
          cursor_position: cursorPosition
        }
      });
      
      if (error) {
        console.error('Error invoking live-typing function:', error);
        return;
      }
      
      lastSentContentRef.current = content;
      console.log('Typing event sent successfully:', data);
    } catch (error) {
      console.error('Error sending typing event:', error);
    }
  }, [user?.id, filePath]);

  // Clean up typing sessions for current user except files with active locks
  const cleanupTypingSessionsSmartly = useCallback(async (activeFilePath?: string) => {
    if (!user?.id) return;

    try {
      console.log('Smart cleanup: preserving sessions for files with locks, active file:', activeFilePath);
      
      // Get all current live editing sessions where this user has a lock
      const { data: lockedSessions, error: lockError } = await supabase
        .from('live_editing_sessions')
        .select('file_path')
        .eq('locked_by', user.id);

      if (lockError) {
        console.error('Error fetching locked sessions:', lockError);
        return;
      }

      const lockedFiles = new Set(lockedSessions?.map(s => s.file_path) || []);
      
      // Add the current active file to protected files
      if (activeFilePath) {
        lockedFiles.add(activeFilePath);
      }

      console.log('Protected files (locked or active):', Array.from(lockedFiles));

      // Get all typing sessions for this user
      const { data: typingSessions, error: fetchError } = await supabase
        .from('live_typing_sessions')
        .select('file_path')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching typing sessions:', fetchError);
        return;
      }

      // Delete typing sessions only for files that are NOT locked and NOT active
      for (const session of typingSessions || []) {
        if (!lockedFiles.has(session.file_path)) {
          console.log('Deleting typing session for unprotected file:', session.file_path);
          
          const { error: deleteError } = await supabase.functions.invoke('live-typing', {
            body: {
              method: 'DELETE',
              file_path: session.file_path,
              user_id: user.id
            }
          });
          
          if (deleteError) {
            console.error('Error deleting typing session:', deleteError);
          }
        } else {
          console.log('Preserving typing session for protected file:', session.file_path);
        }
      }
      
      console.log('Smart cleanup completed');
    } catch (error) {
      console.error('Error in smart cleanup:', error);
    }
  }, [user?.id]);

  // Clean up typing session for specific file
  const cleanupTypingSession = useCallback(async () => {
    if (!user?.id || !filePath || cleanupExecutedRef.current) return;

    cleanupExecutedRef.current = true;

    try {
      console.log('Cleaning up typing session for:', filePath);
      
      const { data, error } = await supabase.functions.invoke('live-typing', {
        body: {
          method: 'DELETE',
          file_path: filePath,
          user_id: user.id
        }
      });
      
      if (error) {
        console.error('Error cleaning up typing session:', error);
      } else {
        console.log('Typing session cleaned up successfully:', data);
      }
    } catch (error) {
      console.error('Error cleaning up typing session:', error);
    }
  }, [user?.id, filePath]);

  // Debounced typing handler
  const handleTyping = useCallback((content: string, cursorPosition: number = 0) => {
    console.log('handleTyping called with content length:', content.length);
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing event immediately for responsiveness
    sendTypingEvent(content, cursorPosition);
    
    // Set timeout to mark as not typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000); // Stop "typing" indicator after 1 second of inactivity
  }, [sendTypingEvent]);

  // Set up real-time subscription for typing events
  useEffect(() => {
    if (!filePath) {
      console.log('No filePath, skipping realtime subscription');
      return;
    }

    console.log('Setting up realtime subscription for live typing:', filePath);

    const channel = supabase
      .channel(`live-typing-${filePath}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_typing_sessions',
          filter: `file_path=eq.${filePath}`
        },
        (payload) => {
          console.log('Live typing event received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newSession = payload.new as TypingSession;
            
            // Don't show our own typing
            if (newSession.user_id === user?.id) {
              console.log('Ignoring own typing session');
              return;
            }
            
            console.log('Processing typing session from another user:', newSession.user_id);
            
            setTypingSessions(prev => {
              const filtered = prev.filter(s => 
                !(s.file_path === newSession.file_path && s.user_id === newSession.user_id)
              );
              return [...filtered, newSession];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedSession = payload.old as TypingSession;
            console.log('Removing typing session:', deletedSession.user_id);
            
            setTypingSessions(prev => 
              prev.filter(s => 
                !(s.file_path === deletedSession.file_path && s.user_id === deletedSession.user_id)
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Live typing subscription status:', status);
      });

    return () => {
      console.log('Cleaning up live typing subscription');
      supabase.removeChannel(channel);
    };
  }, [filePath, user?.id]);

  // Enhanced cleanup on file path change or unmount
  useEffect(() => {
    // Reset cleanup flag when file path changes
    cleanupExecutedRef.current = false;

    // Clean up typing sessions smartly when switching to a new file
    if (filePath && user?.id) {
      cleanupTypingSessionsSmartly(filePath);
    }

    return () => {
      cleanupTypingSession();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [filePath, cleanupTypingSession, cleanupTypingSessionsSmartly, user?.id]);

  // Add page visibility and beforeunload event listeners for cleanup
  useEffect(() => {
    const handlePageHide = () => {
      console.log('Page hiding, running smart cleanup');
      cleanupTypingSessionsSmartly();
    };

    const handleBeforeUnload = () => {
      console.log('Page unloading, running smart cleanup');
      cleanupTypingSessionsSmartly();
    };

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handlePageHide();
      }
    });

    // Listen for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [cleanupTypingSessionsSmartly]);

  // Get latest content from other users
  const getLatestTypingContent = useCallback(() => {
    const latestSession = typingSessions
      .filter(s => s.file_path === filePath)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    
    return latestSession?.content || null;
  }, [typingSessions, filePath]);

  return {
    typingSessions: typingSessions.filter(s => s.file_path === filePath),
    isTyping,
    handleTyping,
    cleanupTypingSession,
    getLatestTypingContent
  };
}
