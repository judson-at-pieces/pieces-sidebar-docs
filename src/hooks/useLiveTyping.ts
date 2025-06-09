
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

  // Clean up typing session
  const cleanupTypingSession = useCallback(async () => {
    if (!user?.id || !filePath) return;

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

  // Cleanup on unmount or file change
  useEffect(() => {
    return () => {
      cleanupTypingSession();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [cleanupTypingSession]);

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
