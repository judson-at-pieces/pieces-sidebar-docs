
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEBUG_AUTOSAVE = true;

interface AutoSaveOptions {
  delay?: number;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const { delay = 1500, onSaveStart, onSaveComplete, onSaveError } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  const abortControllerRef = useRef<AbortController>();

  const save = useCallback(async (
    filePath: string,
    content: string,
    userId: string,
    branchName: string
  ): Promise<boolean> => {
    if (isSavingRef.current) {
      if (DEBUG_AUTOSAVE) {
        console.log('💾 Save already in progress, skipping');
      }
      return false;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    isSavingRef.current = true;
    onSaveStart?.();
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      if (DEBUG_AUTOSAVE) {
        console.log('💾 Starting auto-save for:', filePath, 'in branch:', branchName);
      }

      const { error } = await supabase
        .from('live_editing_sessions')
        .upsert({
          file_path: filePath,
          content,
          user_id: userId,
          branch_name: branchName,
          locked_by: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'file_path,branch_name'
        });

      if (abortControllerRef.current?.signal.aborted) {
        if (DEBUG_AUTOSAVE) {
          console.log('💾 Save was aborted');
        }
        return false;
      }

      if (error) {
        console.error('💾 Auto-save failed:', error);
        onSaveError?.(new Error(error.message));
        return false;
      }

      if (DEBUG_AUTOSAVE) {
        console.log('💾 Auto-save completed successfully');
      }

      onSaveComplete?.();
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        if (DEBUG_AUTOSAVE) {
          console.log('💾 Save request was aborted');
        }
        return false;
      }
      
      console.error('💾 Auto-save error:', error);
      onSaveError?.(error as Error);
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [onSaveStart, onSaveComplete, onSaveError]);

  const scheduleAutoSave = useCallback((
    filePath: string,
    content: string,
    userId: string,
    branchName: string
  ) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      save(filePath, content, userId, branchName);
    }, delay);
  }, [save, delay]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
    
    isSavingRef.current = false;
    if (DEBUG_AUTOSAVE) {
      console.log('💾 Auto-save cancelled');
    }
  }, []);

  const saveImmediately = useCallback((
    filePath: string,
    content: string,
    userId: string,
    branchName: string
  ) => {
    // Cancel scheduled save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Save immediately
    return save(filePath, content, userId, branchName);
  }, [save]);

  return {
    scheduleAutoSave,
    saveImmediately,
    cancelAutoSave,
    isSaving: () => isSavingRef.current
  };
}
