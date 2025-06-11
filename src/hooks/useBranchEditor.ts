import { useState, useCallback, useRef } from 'react';
import { useBranchContentManager } from './useBranchContentManager';
import { useBranchLockManager } from './useBranchLockManager';

const DEBUG_EDITOR = true;

export function useBranchEditor() {
  const contentManager = useBranchContentManager();
  const lockManager = useBranchLockManager();
  
  const [selectedFile, setSelectedFile] = useState<string>();
  const [localContent, setLocalContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const lastBranch = useRef<string | null>(null);
  const loadingFile = useRef<string | null>(null);

  // Handle file selection with proper content loading
  const selectFile = useCallback(async (filePath: string) => {
    if (selectedFile === filePath) return;
    
    if (DEBUG_EDITOR) {
      console.log('📝 Selecting file:', filePath, 'on branch:', contentManager.currentBranch);
    }

    // Save current content if we have a lock
    if (selectedFile && lockManager.myCurrentLock?.filePath === selectedFile) {
      await contentManager.saveContent(selectedFile, localContent, contentManager.currentBranch, true);
      await lockManager.releaseLock(selectedFile, contentManager.currentBranch);
    }

    loadingFile.current = filePath;
    setIsLoading(true);
    setSelectedFile(filePath);

    try {
      // Load content for the selected file and current branch
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
          lockManager.acquireLock(filePath, contentManager.currentBranch);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      if (loadingFile.current === filePath) {
        setLocalContent("Error loading file content");
      }
    } finally {
      if (loadingFile.current === filePath) {
        setIsLoading(false);
        loadingFile.current = null;
      }
    }
  }, [selectedFile, localContent, contentManager, lockManager]);

  // Handle content changes with auto-save
  const updateContent = useCallback((newContent: string) => {
    if (!selectedFile) return;
    
    const canEdit = lockManager.isFileLockedByMe(selectedFile, contentManager.currentBranch);
    if (!canEdit) return;

    setLocalContent(newContent);
    
    // Auto-save to current branch
    contentManager.saveContent(selectedFile, newContent, contentManager.currentBranch, false);
    
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
      setIsLoading(true);
      try {
        const content = await contentManager.loadContent(selectedFile, newBranch);
        if (content !== null) {
          setLocalContent(content);
        } else {
          // Keep current content if no branch-specific content exists
          setLocalContent(localContent);
        }

        // Try to acquire lock on new branch
        setTimeout(() => {
          lockManager.acquireLock(selectedFile, newBranch);
        }, 200);
      } catch (error) {
        console.error('Error loading content for new branch:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedFile, localContent, contentManager, lockManager]);

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
    selectedFile,
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
