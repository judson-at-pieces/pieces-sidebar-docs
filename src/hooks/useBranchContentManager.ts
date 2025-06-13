
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBranchCookie } from '@/utils/branchCookies';
import { logger } from '@/utils/logger';

interface BranchContent {
  file_path: string;
  content: string;
  user_id: string;
  branch_name: string;
  updated_at: string;
}

const DEBUG_BRANCH_CONTENT = true;

export function useBranchContentManager() {
  const [currentBranch, setCurrentBranch] = useState<string>(getBranchCookie() || 'main');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const saveInProgress = useRef(false);

  if (DEBUG_BRANCH_CONTENT) {
    console.log('🌿 Branch Content Manager - Current Branch:', currentBranch);
  }

  // Listen for branch cookie changes
  useEffect(() => {
    const checkBranchCookie = () => {
      const cookieBranch = getBranchCookie() || 'main';
      if (cookieBranch !== currentBranch) {
        if (DEBUG_BRANCH_CONTENT) {
          console.log('🌿 Branch changed from:', currentBranch, 'to:', cookieBranch);
        }
        setCurrentBranch(cookieBranch);
      }
    };

    const interval = setInterval(checkBranchCookie, 100);
    return () => clearInterval(interval);
  }, [currentBranch]);

  // Load content for a specific file and branch
  const loadContent = useCallback(async (filePath: string, branchName: string): Promise<string | null> => {
    if (DEBUG_BRANCH_CONTENT) {
      console.log('🌿 Loading content for:', filePath, 'branch:', branchName);
    }

    try {
      // First check database for branch-specific content
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('content')
        .eq('file_path', filePath)
        .eq('branch_name', branchName)
        .maybeSingle();

      if (error) {
        console.error('Error loading from database:', error);
        logger.error('Database error loading content', { error, filePath, branchName });
      } else if (data?.content) {
        if (DEBUG_BRANCH_CONTENT) {
          console.log('🌿 Found content in database for branch:', branchName);
        }
        return data.content;
      }

      // Fallback to file system if no branch-specific content
      let fetchPath = filePath;
      if (!fetchPath.endsWith('.md')) {
        fetchPath = `${fetchPath}.md`;
      }
      
      const cleanFetchPath = fetchPath.replace(/^\/+/, '');
      const fetchUrl = `/content/${cleanFetchPath}`;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/markdown, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        if (DEBUG_BRANCH_CONTENT) {
          console.log('🌿 Loaded from filesystem');
        }
        return content;
      }

      return null;
    } catch (error) {
      console.error('Error in loadContent:', error);
      logger.error('Error loading content', { error, filePath, branchName });
      return null;
    }
  }, []);

  // Save content to a specific branch
  const saveContent = useCallback(async (filePath: string, content: string, branchName: string, immediate = false): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('Attempted to save content without user authentication', { filePath, branchName });
        return false;
      }

      if (saveInProgress.current) {
        if (DEBUG_BRANCH_CONTENT) {
          console.log('🌿 Save already in progress, skipping');
        }
        return false;
      }

      const performSave = async () => {
        try {
          saveInProgress.current = true;
          setIsAutoSaving(true);
          
          if (DEBUG_BRANCH_CONTENT) {
            console.log('🌿 Saving content for:', filePath, 'to branch:', branchName);
          }

          const { error } = await supabase
            .from('live_editing_sessions')
            .upsert({
              file_path: filePath,
              content,
              user_id: user.id,
              branch_name: branchName,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'file_path,branch_name'
            });

          if (error) {
            console.error('🌿 Save error:', error);
            logger.error('Error saving content to database', { error, filePath, branchName });
            return false;
          }

          if (DEBUG_BRANCH_CONTENT) {
            console.log('🌿 Save completed for branch:', branchName);
          }
          return true;

        } catch (error) {
          console.error('🌿 Save exception:', error);
          logger.error('Exception during content save', { error, filePath, branchName });
          return false;
        } finally {
          saveInProgress.current = false;
          setIsAutoSaving(false);
        }
      };

      if (immediate) {
        return await performSave();
      } else {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        
        // Set new timeout for auto-save
        autoSaveTimeoutRef.current = setTimeout(performSave, 1500);
        return true;
      }
    } catch (error) {
      logger.error('Error in saveContent function', { error, filePath, branchName });
      return false;
    }
  }, []);

  // Get all content for a specific branch
  const getBranchContent = useCallback(async (branchName: string): Promise<Map<string, string>> => {
    try {
      const { data, error } = await supabase
        .from('live_editing_sessions')
        .select('file_path, content')
        .eq('branch_name', branchName)
        .not('content', 'is', null)
        .neq('content', '');

      if (error) {
        console.error('Error fetching branch content:', error);
        logger.error('Error fetching branch content from database', { error, branchName });
        return new Map();
      }

      const contentMap = new Map<string, string>();
      (data || []).forEach(session => {
        contentMap.set(session.file_path, session.content);
      });

      if (DEBUG_BRANCH_CONTENT) {
        console.log('🌿 Loaded', contentMap.size, 'files for branch:', branchName);
      }

      return contentMap;
    } catch (error) {
      console.error('Error in getBranchContent:', error);
      logger.error('Exception in getBranchContent', { error, branchName });
      return new Map();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      saveInProgress.current = false;
      setIsAutoSaving(false);
    };
  }, []);

  return {
    currentBranch,
    isAutoSaving,
    loadContent,
    saveContent,
    getBranchContent
  };
}
