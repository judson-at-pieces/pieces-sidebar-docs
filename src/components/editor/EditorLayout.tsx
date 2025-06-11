import { useState, useEffect } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLockManager } from "@/hooks/useLockManager";
import { useContentManager } from "@/hooks/useContentManager";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
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
  const { sessions } = useBranchSessions(currentBranch);

  // Initialize the robust locking system
  const lockManager = useLockManager();
  const contentManager = useContentManager(lockManager);

  const [selectedFile, setSelectedFile] = useState<string>();
  const [localContent, setLocalContent] = useState("");
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [loadingContent, setLoadingContent] = useState(false);
  const [lastBranch, setLastBranch] = useState<string | null>(null);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  if (DEBUG_EDITOR) {
    console.log('🎯 EDITOR STATE:', {
      selectedFile,
      currentBranch,
      lastBranch,
      localContentLength: localContent.length,
      isSwitchingBranch
    });
  }

  // Handle branch changes with improved isolation
  useEffect(() => {
    if (!currentBranch) return;
    
    // First time initialization
    if (lastBranch === null) {
      setLastBranch(currentBranch);
      return;
    }
    
    // Actual branch change detected
    if (currentBranch !== lastBranch) {
      if (DEBUG_EDITOR) {
        console.log('🔄 Branch switch detected:', lastBranch, '->', currentBranch);
      }
      
      const handleBranchSwitch = async () => {
        setIsSwitchingBranch(true);
        
        try {
          // Step 1: Force release ALL locks from old branch
          if (DEBUG_EDITOR) {
            console.log('🔒 Releasing all locks from old branch');
          }
          
          await lockManager.releaseAllMyLocks();
          
          // Step 2: Save current content to old branch if needed
          if (selectedFile && localContent && selectedFile.trim()) {
            if (DEBUG_EDITOR) {
              console.log('💾 Saving content to old branch:', lastBranch);
            }
            await contentManager.saveContentToBranch(selectedFile, localContent, lastBranch);
          }
          
          // Step 3: Clear content and force refresh
          setLocalContent("");
          await contentManager.refreshContentForBranch(currentBranch);
          
          // Step 4: Load content for new branch
          if (selectedFile) {
            const newContent = await contentManager.loadContentForced(selectedFile, currentBranch);
            setLocalContent(newContent || "");
            
            // Step 5: Try to acquire lock in new branch
            setTimeout(async () => {
              const lockAcquired = await lockManager.acquireLock(selectedFile);
              if (DEBUG_EDITOR) {
                console.log('🔒 New branch lock acquisition:', lockAcquired);
              }
            }, 500);
          }
          
        } catch (error) {
          console.error('❌ Error during branch switch:', error);
        } finally {
          setLastBranch(currentBranch);
          setIsSwitchingBranch(false);
        }
      };
      
      handleBranchSwitch();
    }
  }, [currentBranch, lastBranch, selectedFile, localContent, lockManager, contentManager]);

  const loadFileContent = async (filePath: string) => {
    setLoadingContent(true);
    
    try {
      const content = await contentManager.loadContent(filePath);
      
      if (content !== null) {
        setLocalContent(content);
        if (DEBUG_EDITOR) {
          console.log('📄 Loaded content for:', filePath, 'in branch:', currentBranch);
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

This content is specific to the ${currentBranch} branch.

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`;
        setLocalContent(defaultContent);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setLocalContent("Error loading file content");
    } finally {
      setLoadingContent(false);
    }
  };

  // Auto-save when user has the lock and content changes (but not during branch switches)
  useEffect(() => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent && !isSwitchingBranch) {
      contentManager.saveContent(selectedFile, localContent, false);
    }
  }, [selectedFile, localContent, lockManager, contentManager, isSwitchingBranch]);

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
    if (selectedFile === filePath) return;

    if (DEBUG_EDITOR) {
      console.log('=== ATOMIC FILE SELECTION ===', {
        from: selectedFile,
        to: filePath,
        branch: currentBranch
      });
    }
    
    setLoadingContent(true);
    
    try {
      // Save current content if we have it
      if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent) {
        if (DEBUG_EDITOR) {
          console.log('💾 Saving current content before switch');
        }
        await contentManager.saveContent(selectedFile, localContent, true);
      }
      
      // Use atomic file switching instead of separate operations
      if (DEBUG_EDITOR) {
        console.log('🔄 Using atomic file switch operation');
      }
      
      const lockAcquired = await lockManager.switchToFile(filePath);
      
      // Update selected file regardless of lock status
      setSelectedFile(filePath);
      
      // Load content for the new file
      await loadFileContent(filePath);
      
      if (DEBUG_EDITOR) {
        console.log('🔒 Atomic file switch result:', { 
          filePath, 
          lockAcquired,
          hasLock: lockManager.isFileLockedByMe(filePath)
        });
      }
      
    } catch (error) {
      console.error('❌ Error in atomic file selection:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && !isSwitchingBranch) {
      setLocalContent(newContent);
    }
  };

  const handleAcquireLock = async () => {
    if (selectedFile) {
      await lockManager.acquireLock(selectedFile);
    }
  };

  const handleTakeLock = async () => {
    if (selectedFile) {
      await lockManager.forceTakeLock(selectedFile);
    }
  };

  const handleSave = async () => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
      await contentManager.saveContent(selectedFile, localContent, true);
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
            isAcquiringLock={false}
            onAcquireLock={handleAcquireLock}
            currentBranch={currentBranch}
            sessions={sessions}
            hasChanges={hasChanges}
            initialized={initialized}
            branches={branches}
          />
          
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
                  title={`Content Files (${currentBranch})`}
                  description={`Select a file to edit its content in the ${currentBranch} branch`}
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
                    isAcquiringLock={false}
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
