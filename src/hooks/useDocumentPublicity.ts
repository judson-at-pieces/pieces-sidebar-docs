
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDocumentPublicity() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateDocumentPublicity = useCallback(async (
    filePath: string, 
    publicity: 'PUBLIC' | 'PRIVATE' | 'DRAFT',
    userId?: string
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          publicity: publicity,
          user_id: userId,
          content: '', // Will be updated with actual content later
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'file_path'
        });

      if (error) {
        console.error('Error updating document publicity:', error);
        toast.error('Failed to update document visibility');
        return false;
      }

      toast.success(`Document visibility updated to ${publicity.toLowerCase()}`);
      return true;
    } catch (error) {
      console.error('Error updating document publicity:', error);
      toast.error('Failed to update document visibility');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const getDocumentPublicity = useCallback(async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('publicity')
        .eq('file_path', filePath)
        .single();

      if (error) {
        // If no record exists, default to PUBLIC
        return 'PUBLIC';
      }

      return data?.publicity || 'PUBLIC';
    } catch (error) {
      console.error('Error getting document publicity:', error);
      return 'PUBLIC';
    }
  }, []);

  const getPublicDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_documents');

      if (error) {
        console.error('Error getting public documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting public documents:', error);
      return [];
    }
  }, []);

  return {
    updateDocumentPublicity,
    getDocumentPublicity,
    getPublicDocuments,
    isUpdating
  };
}
