
import { useCallback, useRef, useEffect, useState } from 'react';
import { useBranchContentManager } from './useBranchContentManager';
import { useBranchLockManager } from './useBranchLockManager';
import { useUrlState } from './useUrlState';
import { logger } from '@/utils/logger';

const DEBUG_EDITOR = true;

export function useBranchEditorWithUrl() {
  const contentManager = useBranchContentManager();
  const lockManager = useBranchLockManager();
  
  // Only store selected file in URL with simple string serialization
  const [selectedFile, setSelectedFileUrl] = useUrlState<string | undefined>(
    'file', 
    undefined,
    (value) => value || '',
    (value) => value || undefined
  );
  
  // Store content only in localStorage, not URL
  const [localContent, setLocalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const lastBranch = useRef<string | null>(null);
  const loadingFile = useRef<string | null>(null);
  const initialLoad = useRef<boolean>(true);
  const lastSelectedFile = useRef<string | undefined>(undefined);

  // Load content from localStorage for the current file and branch
  useEffect(() => {
    if (selectedFile && contentManager.currentBranch) {
      const storageKey = `editor_content_${selectedFile}_${contentManager.currentBranch}`;
      const storedContent = localStorage.getItem(storageKey);
      if (storedContent && !isLoading) {
        setLocalContent(storedContent);
      }
    }
  }, [selectedFile, contentManager.currentBranch, isLoading]);

  // Save content to localStorage whenever it changes
  useEffect(() => {
    if (selectedFile && contentManager.currentBranch && localContent) {
      const storageKey = `editor_content_${selectedFile}_${contentManager.currentBranch}`;
      localStorage.setItem(storageKey, localContent);
    }
  }, [selectedFile, contentManager.currentBranch, localContent]);

  // Initialize from URL/localStorage on mount
  useEffect(() => {
    if (initialLoad.current && selectedFile && contentManager.currentBranch) {
      console.log('🔄 Initializing from URL/localStorage:', { selectedFile, branch: contentManager.currentBranch });
      initialLoad.current = false;
      lastSelectedFile.current = selectedFile;
      
      // Load the file content
      loadFileContent(selectedFile);
    }
  }, [selectedFile, contentManager.currentBranch]);

  // Prevent losing selected file on re-renders
  useEffect(() => {
    if (selectedFile && selectedFile !== lastSelectedFile.current) {
      lastSelectedFile.current = selectedFile;
      console.log('🎯 File selection updated:', selectedFile);
    }
  }, [selectedFile]);

  const loadFileContent = async (filePath: string) => {
    if (DEBUG_EDITOR) {
      console.log('📁 Loading file content:', filePath, 'on branch:', contentManager.currentBranch);
    }

    loadingFile.current = filePath;
    setIsLoading(true);

    try {
      const content = await contentManager.loadContent(filePath, contentManager.currentBranch);
      
      if (loadingFile.current === filePath) {
        if (content !== null) {
          setLocalContent(content);
        } else {
          // Create default content for new file
          const fileName = filePath.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
          const pathForFrontmatter = filePath.replace(/\.md$/, '').replace(/^\//, '');
          
          const defaultContent = `---
title: "${fileName}"
path: "/${pathForFrontmatter}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

# ${fileName}

This content is specific to the ${contentManager.currentBranch} branch.

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`;
          setLocalContent(defaultContent);
        }

        // Try to acquire lock
        setTimeout(() => {
          lockManager.acquireLock(filePath, contentManager.currentBranch).catch(error => {
            logger.error('Error acquiring lock', { error, filePath, branch: contentManager.currentBranch });
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      logger.error('Error loading file content', { error, filePath, branch: contentManager.currentBranch });
      if (loadingFile.current === filePath) {
        setLocalContent("Error loading file content");
      }
    } finally {
      if (loadingFile.current === filePath) {
        setIsLoading(false);
        loadingFile.current = null;
      }
    }
  };

  // Handle file selection with proper content loading
  const selectFile = useCallback(async (filePath: string) => {
    if (selectedFile === filePath && lastSelectedFile.current === filePath) {
      console.log('📝 File already selected:', filePath);
      return;
    }
    
    if (DEBUG_EDITOR) {
      console.log('📝 Selecting file:', filePath, 'on branch:', contentManager.currentBranch);
    }

    // Save current content if we have a lock
    if (selectedFile && lockManager.myCurrentLock?.filePath === selectedFile) {
      try {
        await contentManager.saveContent(selectedFile, localContent, contentManager.currentBranch, true);
        await lockManager.releaseLock(selectedFile, contentManager.currentBranch);
      } catch (error) {
        logger.error('Error saving/releasing lock during file switch', { error, selectedFile });
      }
    }

    // Update URL with selected file - this should persist across refreshes
    lastSelectedFile.current = filePath;
    setSelectedFileUrl(filePath);
    
    // Load the file content
    await loadFileContent(filePath);
  }, [selectedFile, localContent, contentManager, lockManager, setSelectedFileUrl]);

  // Handle content changes with auto-save
  const updateContent = useCallback((newContent: string) => {
    if (!selectedFile) return;
    
    const canEdit = lockManager.isFileLockedByMe(selectedFile, contentManager.currentBranch);
    if (!canEdit) return;

    // Update local state
    setLocalContent(newContent);
    
    // Auto-save to current branch
    contentManager.saveContent(selectedFile, newContent, contentManager.currentBranch, false).catch(error => {
      logger.error('Error auto-saving content', { error, selectedFile, branch: contentManager.currentBranch });
    });
    
    if (DEBUG_EDITOR) {
      console.log('📝 Content updated, auto-saving to branch:', contentManager.currentBranch);
    }
  }, [selectedFile, contentManager, lockManager]);

  // Handle branch changes
  const handleBranchChange = useCallback(async (newBranch: string) => {
    if (newBranch === lastBranch.current) return;
    
    if (DEBUG_EDITOR) {
      console.log('🌿 Branch changing from:', lastBranch.current, 'to:', newBranch);
    }

    try {
      // Save current content to old branch if we have a lock
      if (selectedFile && lockManager.myCurrentLock?.filePath === selectedFile && lastBranch.current) {
        await contentManager.saveContent(selectedFile, localContent, lastBranch.current, true);
      }

      // Release current lock
      if (lockManager.myCurrentLock) {
        await lockManager.releaseLock(
          lockManager.myCurrentLock.filePath, 
          lockManager.myCurrentLock.branch
        );
      }

      lastBranch.current = newBranch;

      // Reload content for new branch if we have a selected file
      if (selectedFile) {
        await loadFileContent(selectedFile);
      }
    } catch (error) {
      logger.error('Error during branch change', { error, newBranch, selectedFile });
    }
  }, [selectedFile, localContent, contentManager, lockManager, loadFileContent]);

  // Initialize last branch
  if (lastBranch.current === null) {
    lastBranch.current = contentManager.currentBranch;
  }

  // Check for branch changes
  if (contentManager.currentBranch !== lastBranch.current) {
    handleBranchChange(contentManager.currentBranch);
  }

  return {
    // State
    selectedFile: selectedFile || lastSelectedFile.current,
    localContent,
    isLoading,
    currentBranch: contentManager.currentBranch,
    isAutoSaving: contentManager.isAutoSaving,
    
    // Actions
    selectFile,
    updateContent,
    
    // Lock state
    isFileLocked: selectedFile ? lockManager.isFileLocked(selectedFile, contentManager.currentBranch) : false,
    isFileLockedByMe: selectedFile ? lockManager.isFileLockedByMe(selectedFile, contentManager.currentBranch) : false,
    lockOwnerName: selectedFile ? lockManager.getFileLockOwnerName(selectedFile, contentManager.currentBranch) : 'Unknown',
    
    // Actions
    acquireLock: () => selectedFile ? lockManager.acquireLock(selectedFile, contentManager.currentBranch) : Promise.resolve(false),
    releaseLock: () => selectedFile ? lockManager.releaseLock(selectedFile, contentManager.currentBranch) : Promise.resolve(false)
  };
}
