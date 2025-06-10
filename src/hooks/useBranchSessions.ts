
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BranchSession {
  file_path: string;
  content: string;
  branch_name: string;
  locked_by: string | null;
  locked_at: string | null;
  updated_at: string;
}

const DEBUG = true;

export function useBranchSessions(currentBranch: string) {
  const [sessions, setSessions] = useState<BranchSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!currentBranch) return;
    
    if (DEBUG) console.log('🗂️ FETCHING SESSIONS FOR BRANCH:', currentBranch);
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content, branch_name, locked_by, locked_at, updated_at')
        .eq('branch_name', currentBranch)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      const validSessions = (data || [])
        .filter(session => session.content && session.content.trim())
        .map(session => ({
          file_path: session.file_path,
          content: session.content,
          branch_name: session.branch_name,
          locked_by: session.locked_by,
          locked_at: session.locked_at,
          updated_at: session.updated_at
        }));

      setSessions(validSessions);
      
      if (DEBUG) {
        console.log('🗂️ SESSIONS LOADED:', {
          branch: currentBranch,
          count: validSessions.length,
          files: validSessions.map(s => s.file_path)
        });
      }
    } catch (error) {
      console.error('Error in fetchSessions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentBranch]);

  // Setup real-time subscription
  useEffect(() => {
    if (!currentBranch) return;
    
    if (DEBUG) console.log('🗂️ SETTING UP REALTIME FOR BRANCH:', currentBranch);
    
    const channel = supabase
      .channel(`branch_sessions_${currentBranch}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_editing_sessions',
          filter: `branch_name=eq.${currentBranch}`
        },
        (payload) => {
          if (DEBUG) console.log('🗂️ REALTIME UPDATE:', payload);
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      if (DEBUG) console.log('🗂️ CLEANING UP REALTIME FOR BRANCH:', currentBranch);
      supabase.removeChannel(channel);
    };
  }, [currentBranch, fetchSessions]);

  // Fetch sessions when branch changes
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    refreshSessions: fetchSessions
  };
}
