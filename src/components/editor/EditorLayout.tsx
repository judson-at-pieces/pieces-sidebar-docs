import { useState, useEffect, useRef } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLockManager } from "@/hooks/useLockManager";
import { useContentManager } from "@/hooks/useContentManager";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { useBranchContentStore } from "@/hooks/useBranchContentStore";
import { useBranchSwitcher } from "@/hooks/useBranchSwitcher";
import { NavigationEditor } from "./NavigationEditor";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { Button } from "@/components/ui/button";
import { EditorMainHeader } from "./EditorMainHeader";
import { NewEditorTabNavigation } from "./NewEditorTabNavigation";

const DEBUG_EDITOR = true;

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { currentBranch, initialized, branches } = useBranchManager();

  // Initialize systems
  const lockManager = useLockManager();
  const contentManager = useContentManager(lockManager);
  const branchContentStore = useBranchContentStore();
  const { switchBranch, isSwitching } = useBranchSwitcher();

  // Use the reactive branch from contentManager
  const effectiveBranch = contentManager.currentBranch;
  const { sessions } = useBranchSessions(effectiveBranch);

  const [selectedFile, setSelectedFile] = useState<string>();
  const [localContent, setLocalContent] = useState("");
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [loadingContent, setLoadingContent] = useState(false);
  const [lastBranch, setLastBranch] = useState<string | null>(null);
  
  // Add guards to prevent race conditions
  const currentlyLoadingFile = useRef<string | null>(null);

  if (DEBUG_EDITOR) {
    console.log('🎯 EDITOR STATE:', {
      selectedFile,
      currentBranch,
      effectiveBranch,
      lastBranch,
      localContentLength: localContent.length,
      isSwitching,
      currentlyLoadingFile: currentlyLoadingFile.current
    });
  }

  // Handle branch changes with proper auto-save pausing
  useEffect(() => {
    if (!effectiveBranch) return;
    
    if (lastBranch === null) {
      setLastBranch(effectiveBranch);
      return;
    }
    
    if (effectiveBranch !== lastBranch && !isSwitching) {
      if (DEBUG_EDITOR) {
        console.log('🔄 Branch switch detected:', lastBranch, '->', effectiveBranch);
      }
      
      const handleBranchSwitch = async () => {
        // PAUSE auto-save during branch switch
        contentManager.pauseAutoSave();
        
        const success = await switchBranch(lastBranch, effectiveBranch, selectedFile, localContent);
        
        if (success) {
          setLocalContent("");
          setLoadingContent(true);
          
          if (selectedFile) {
            await loadFileContent(selectedFile);
          } else {
            setLoadingContent(false);
          }
          
          setLastBranch(effectiveBranch);
          
          // Ensure we're unlocked and resume auto-save
          setTimeout(() => {
            lockManager.releaseAllMyLocks();
            contentManager.resumeAutoSave();
            if (DEBUG_EDITOR) {
              console.log('🔓 Branch switch complete - locks released, auto-save resumed');
            }
          }, 500);
        } else {
          console.error('❌ Branch switch failed');
          setLoadingContent(false);
          contentManager.resumeAutoSave();
        }
      };
      
      handleBranchSwitch();
    }
  }, [effectiveBranch, lastBranch, selectedFile, localContent, isSwitching, switchBranch, lockManager, contentManager]);

  const loadFileContent = async (filePath: string) => {
    if (currentlyLoadingFile.current && currentlyLoadingFile.current !== filePath) {
      if (DEBUG_EDITOR) {
        console.log('🚫 Cancelling load for:', currentlyLoadingFile.current, 'new request:', filePath);
      }
      return;
    }
    
    currentlyLoadingFile.current = filePath;
    setLoadingContent(true);
    
    try {
      const content = await contentManager.loadContentForced(filePath, effectiveBranch);
      
      if (currentlyLoadingFile.current !== filePath) {
        if (DEBUG_EDITOR) {
          console.log('🚫 File changed during load, ignoring result for:', filePath);
        }
        return;
      }
      
      if (content !== null) {
        setLocalContent(content);
        branchContentStore.setContent(effectiveBranch, filePath, content);
        if (DEBUG_EDITOR) {
          console.log('📄 Force loaded and cached content for:', filePath, 'in branch:', effectiveBranch);
        }
      } else {
        // Create default content
        const fileName = filePath.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
        const pathForFrontmatter = filePath.replace(/\.md$/, '').replace(/^\//, '');
        
        const defaultContent = `---
title: "${fileName}"
path: "/${pathForFrontmatter}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

# ${fileName}

This content is specific to the ${effectiveBranch} branch.

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`;
        setLocalContent(defaultContent);
        branchContentStore.setContent(effectiveBranch, filePath, defaultContent);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      if (currentlyLoadingFile.current === filePath) {
        setLocalContent("Error loading file content");
      }
    } finally {
      if (currentlyLoadingFile.current === filePath) {
        setLoadingContent(false);
        currentlyLoadingFile.current = null;
        
        if (DEBUG_EDITOR) {
          console.log('✅ File loading complete and UI unfrozen for:', filePath);
        }
      }
    }
  };

  // Simplified auto-save with better branch awareness
  useEffect(() => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent && !isSwitching && !currentlyLoadingFile.current) {
      // Save to branch store immediately for isolation
      branchContentStore.setContent(effectiveBranch, selectedFile, localContent);
      
      // Auto-save to database (this now has built-in branch switch protection)
      contentManager.saveContent(selectedFile, localContent);
    }
  }, [selectedFile, localContent, lockManager, contentManager, branchContentStore, effectiveBranch, isSwitching]);

  // Release lock when navigating away from the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lockManager.myCurrentLock) {
        lockManager.releaseLock(lockManager.myCurrentLock);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && lockManager.myCurrentLock) {
        lockManager.releaseLock(lockManager.myCurrentLock);
      }
    };

    const handlePopState = () => {
      if (lockManager.myCurrentLock) {
        lockManager.releaseLock(lockManager.myCurrentLock);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lockManager]);

  const handleFileSelect = async (filePath: string) => {
    if (selectedFile === filePath || isSwitching) return;

    if (DEBUG_EDITOR) {
      console.log('=== FILE SELECTION ===', filePath, 'in branch:', effectiveBranch);
    }
    
    // Cancel any ongoing file load
    if (currentlyLoadingFile.current) {
      currentlyLoadingFile.current = null;
    }
    
    // Save current file content to branch store before switching
    if (selectedFile && localContent) {
      branchContentStore.captureCurrentContent(effectiveBranch, selectedFile, localContent);
      
      // Force immediate save if we have lock
      if (lockManager.isFileLockedByMe(selectedFile)) {
        await contentManager.saveContentToBranch(selectedFile, localContent, effectiveBranch);
      }
    }
    
    setSelectedFile(filePath);
    await loadFileContent(filePath);
    
    // Try to acquire lock AFTER loading is complete
    setTimeout(() => {
      if (DEBUG_EDITOR) {
        console.log('🔒 Attempting to acquire lock for:', filePath);
      }
      lockManager.acquireLock(filePath);
    }, 100);
  };

  const handleContentChange = (newContent: string) => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && !isSwitching && !currentlyLoadingFile.current) {
      setLocalContent(newContent);
      // Immediately save to branch store for isolation
      branchContentStore.setContent(effectiveBranch, selectedFile, newContent);
    }
  };

  const handleAcquireLock = async () => {
    if (selectedFile && !isSwitching) {
      await lockManager.acquireLock(selectedFile);
    }
  };

  const handleTakeLock = async () => {
    if (selectedFile && !isSwitching) {
      await lockManager.forceTakeLock(selectedFile);
    }
  };

  const handleSave = async () => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && !isSwitching) {
      await contentManager.saveContentToBranch(selectedFile, localContent, effectiveBranch);
    }
  };

  // Derive lock status
  const isLocked = selectedFile ? lockManager.isFileLocked(selectedFile) : false;
  const lockedByMe = selectedFile ? lockManager.isFileLockedByMe(selectedFile) : false;
  const lockedByOther = selectedFile ? lockManager.isFileLockedByOther(selectedFile) : false;
  const lockedByName = selectedFile ? lockManager.getFileLockOwnerName(selectedFile) : null;
  const hasChanges = selectedFile ? contentManager.hasUnsavedChanges(selectedFile, localContent) : false;
  const liveContent = selectedFile ? contentManager.getContent(selectedFile) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary/40 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Editor</p>
            <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-destructive">Failed to Load Editor</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            🔄 Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalLiveFiles = sessions.filter(s => s.content && s.content.trim()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <EditorMainHeader 
        hasChanges={hasChanges}
        totalLiveFiles={totalLiveFiles}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col">
          <NewEditorTabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedFile={selectedFile}
            isLocked={isLocked}
            lockedBy={lockedByName}
            isAcquiringLock={isSwitching || !!currentlyLoadingFile.current}
            onAcquireLock={handleAcquireLock}
            currentBranch={effectiveBranch}
            sessions={sessions}
            hasChanges={hasChanges}
            initialized={initialized}
            branches={branches}
          />
          
          {/* Show loading overlay when switching branches or loading files */}
          {(isSwitching || !!currentlyLoadingFile.current) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  {isSwitching ? 'Switching branches...' : 'Loading file...'}
                </p>
              </div>
            </div>
          )}
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex">
            {activeTab === 'navigation' ? (
              <>
                <FileTreeSidebar
                  title="Navigation Structure"
                  description="Manage the navigation hierarchy"
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  fileStructure={fileStructure}
                />
                <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <NavigationEditor 
                    fileStructure={fileStructure} 
                    onNavigationChange={refetch}
                  />
                </div>
              </>
            ) : activeTab === 'seo' ? (
              <div className="flex-1">
                <SeoEditor
                  selectedFile={selectedFile}
                  onSeoDataChange={() => {}}
                  fileStructure={fileStructure}
                  onFileSelect={handleFileSelect}
                />
              </div>
            ) : (
              <>
                <FileTreeSidebar
                  title={`Content Files (${effectiveBranch})`}
                  description={`Select a file to edit its content in the ${effectiveBranch} branch`}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  fileStructure={fileStructure}
                  pendingChanges={sessions.map(s => s.file_path)}
                  liveSessions={sessions}
                />
                <div className="flex-1 animate-in fade-in-from-bottom-2 duration-300">
                  <EditorMain 
                    selectedFile={selectedFile}
                    content={loadingContent ? "Loading content..." : localContent}
                    onContentChange={handleContentChange}
                    onSave={handleSave}
                    hasChanges={hasChanges}
                    saving={contentManager.isAutoSaving}
                    isLocked={isLocked}
                    lockedBy={lockedByName}
                    liveContent={liveContent}
                    isAcquiringLock={isSwitching}
                    onTakeLock={handleTakeLock}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
