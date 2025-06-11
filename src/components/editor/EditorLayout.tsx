import { useState, useEffect, useRef } from "react";
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
  const [autoSaveBlocked, setAutoSaveBlocked] = useState(false);
  const [switchCompleted, setSwitchCompleted] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveReenableTimeoutRef = useRef<NodeJS.Timeout>();

  if (DEBUG_EDITOR) {
    console.log('🎯 EDITOR STATE:', {
      selectedFile,
      currentBranch,
      lastBranch,
      localContentLength: localContent.length,
      isSwitchingBranch,
      autoSaveBlocked,
      switchCompleted
    });
  }

  // CONTROLLED auto-save that respects blocking
  useEffect(() => {
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // HARD BLOCK: Do not save if any blocking conditions are met
    if (autoSaveBlocked || isSwitchingBranch || !selectedFile || !lockManager.isFileLockedByMe(selectedFile) || !localContent.trim()) {
      if (DEBUG_EDITOR && (autoSaveBlocked || isSwitchingBranch)) {
        console.log('🚫 AUTO-SAVE HARD BLOCKED:', { autoSaveBlocked, isSwitchingBranch });
      }
      return;
    }

    // Set timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      // Double-check blocking conditions at execution time
      if (!autoSaveBlocked && !isSwitchingBranch && selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
        if (DEBUG_EDITOR) {
          console.log('💾 Auto-saving to branch:', currentBranch);
        }
        contentManager.saveContent(selectedFile, localContent, false);
      } else if (DEBUG_EDITOR) {
        console.log('🚫 AUTO-SAVE BLOCKED AT EXECUTION TIME');
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedFile, localContent, lockManager, contentManager, currentBranch, autoSaveBlocked, isSwitchingBranch]);

  // Enhanced branch switching with complete isolation
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
        console.log('🔄 BRANCH SWITCH INITIATED:', lastBranch, '->', currentBranch);
      }
      
      // STEP 1: IMMEDIATELY block all auto-save operations
      setAutoSaveBlocked(true);
      setIsSwitchingBranch(true);
      setSwitchCompleted(false);
      
      // Clear any pending auto-save and re-enable timeouts
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (autoSaveReenableTimeoutRef.current) {
        clearTimeout(autoSaveReenableTimeoutRef.current);
      }

      const performBranchSwitch = async () => {
        try {
          // STEP 2: Save current content to OLD branch (manual, controlled save)
          if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent.trim()) {
            if (DEBUG_EDITOR) {
              console.log('💾 MANUALLY saving to OLD branch:', lastBranch, 'Content length:', localContent.length);
            }
            
            // Direct save to old branch, bypassing auto-save system entirely
            const saveSuccess = await contentManager.saveContentToBranch(selectedFile, localContent, lastBranch);
            
            if (DEBUG_EDITOR) {
              console.log('💾 Manual save result:', saveSuccess);
            }
            
            // Wait for save to complete
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // STEP 3: Release ALL locks to clear state
          if (lockManager.myCurrentLock) {
            if (DEBUG_EDITOR) {
              console.log('🔓 Releasing lock for branch switch');
            }
            await lockManager.releaseLock(lockManager.myCurrentLock);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // STEP 4: Clear editor content IMMEDIATELY for visual feedback
          setLocalContent("");
          setLoadingContent(true);
          
          // STEP 5: Force refresh content manager for new branch
          await contentManager.refreshContentForBranch(currentBranch);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // STEP 6: Load content from NEW branch (forced, bypassing cache)
          if (selectedFile) {
            if (DEBUG_EDITOR) {
              console.log('📄 FORCE loading from NEW branch:', currentBranch);
            }
            
            const newBranchContent = await contentManager.loadContentForced(selectedFile, currentBranch);
            
            if (newBranchContent !== null) {
              if (DEBUG_EDITOR) {
                console.log('✅ Loaded content from NEW branch, length:', newBranchContent.length);
              }
              setLocalContent(newBranchContent);
            } else {
              // Create default content for new branch
              const fileName = selectedFile.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
              const pathForFrontmatter = selectedFile.replace(/\.md$/, '').replace(/^\//, '');
              
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
              if (DEBUG_EDITOR) {
                console.log('📝 Created default content for NEW branch');
              }
            }
            
            // STEP 7: Try to acquire lock for new branch after content is loaded
            setTimeout(async () => {
              const lockAcquired = await lockManager.acquireLock(selectedFile);
              if (DEBUG_EDITOR) {
                console.log('🔒 Lock acquisition for NEW branch:', lockAcquired);
              }
            }, 400);
          }
          
        } catch (error) {
          console.error('❌ Error during branch switch:', error);
          setLocalContent("Error loading content for new branch");
        } finally {
          // STEP 8: Mark operations complete but keep auto-save blocked
          setLoadingContent(false);
          setLastBranch(currentBranch);
          setIsSwitchingBranch(false);
          setSwitchCompleted(true);
          
          if (DEBUG_EDITOR) {
            console.log('✅ Branch switch completed, starting 5-second auto-save cooldown');
          }
          
          // STEP 9: Re-enable auto-save after 5-second delay
          autoSaveReenableTimeoutRef.current = setTimeout(() => {
            setAutoSaveBlocked(false);
            if (DEBUG_EDITOR) {
              console.log('✅ Auto-save re-enabled after cooldown');
            }
          }, 5000);
        }
      };
      
      performBranchSwitch();
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

  // Block content changes during branch switching
  const handleContentChange = (newContent: string) => {
    if (isSwitchingBranch || autoSaveBlocked) {
      if (DEBUG_EDITOR) {
        console.log('🚫 Content change blocked - operations in progress');
      }
      return;
    }
    
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
      setLocalContent(newContent);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (selectedFile === filePath) return;

    if (DEBUG_EDITOR) {
      console.log('=== FILE SELECTION ===', filePath, 'in branch:', currentBranch);
    }
    
    // Save current file content before switching
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent) {
      await contentManager.saveContent(selectedFile, localContent, true);
    }
    
    // Set the new file first
    setSelectedFile(filePath);
    await loadFileContent(filePath);
    
    // The enhanced acquireLock will automatically release ALL other locks first
    if (DEBUG_EDITOR) {
      console.log('🔒 Acquiring lock for new file (will auto-release others):', filePath);
    }
    
    const lockAcquired = await lockManager.acquireLock(filePath);
    
    if (DEBUG_EDITOR) {
      console.log('🔒 Lock acquisition result:', lockAcquired);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (autoSaveReenableTimeoutRef.current) {
        clearTimeout(autoSaveReenableTimeoutRef.current);
      }
    };
  }, []);

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
          
          {/* Show branch switching overlay */}
          {isSwitchingBranch && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center space-y-4 p-6 bg-card border rounded-lg shadow-lg">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Switching to {currentBranch} branch</p>
                  <p className="text-sm text-muted-foreground">Saving current content and loading branch content...</p>
                  <p className="text-xs text-muted-foreground">Auto-save will resume in 5 seconds after completion</p>
                </div>
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
