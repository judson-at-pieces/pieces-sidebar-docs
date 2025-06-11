import { useState, useEffect } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLockManager } from "@/hooks/useLockManager";
import { useContentManager } from "@/hooks/useContentManager";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { useBranchContentStore } from "@/hooks/useBranchContentStore";
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

  // Initialize systems
  const lockManager = useLockManager();
  const contentManager = useContentManager(lockManager);
  const branchContentStore = useBranchContentStore();

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

  // Handle branch changes with proper content isolation
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
      
      setIsSwitchingBranch(true);
      
      const handleBranchSwitch = async () => {
        try {
          // Step 1: CRITICAL - Capture current editor content to OLD branch
          if (selectedFile && localContent && lastBranch) {
            if (DEBUG_EDITOR) {
              console.log('📸 Capturing current content to OLD branch:', lastBranch);
            }
            
            // Save to branch content store
            branchContentStore.captureCurrentContent(lastBranch, selectedFile, localContent);
            
            // Also save to database if we have lock
            if (lockManager.isFileLockedByMe(selectedFile)) {
              await contentManager.saveContentToBranch(selectedFile, localContent, lastBranch);
            }
          }
          
          // Step 2: Release locks
          if (lockManager.myCurrentLock) {
            await lockManager.releaseLock(lockManager.myCurrentLock);
          }
          
          // Step 3: Clear editor content immediately
          setLocalContent("");
          setLoadingContent(true);
          
          // Step 4: Load content FROM new branch
          if (selectedFile) {
            if (DEBUG_EDITOR) {
              console.log('📄 Loading content FROM new branch:', currentBranch, 'file:', selectedFile);
            }
            
            // First check our branch content store
            let newContent = branchContentStore.getContent(currentBranch, selectedFile);
            
            if (newContent) {
              if (DEBUG_EDITOR) {
                console.log('✅ Found content in branch store, length:', newContent.length);
              }
              setLocalContent(newContent);
            } else {
              // Load from database for this specific branch
              newContent = await contentManager.loadContentForced(selectedFile, currentBranch);
              
              if (newContent !== null) {
                if (DEBUG_EDITOR) {
                  console.log('✅ Loaded content from database, length:', newContent.length);
                }
                setLocalContent(newContent);
                // Cache it in branch store
                branchContentStore.setContent(currentBranch, selectedFile, newContent);
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
                branchContentStore.setContent(currentBranch, selectedFile, defaultContent);
                
                if (DEBUG_EDITOR) {
                  console.log('📝 Created default content for new branch');
                }
              }
            }
            
            setLoadingContent(false);
            
            // Step 5: Try to acquire lock for the new branch
            setTimeout(async () => {
              const lockAcquired = await lockManager.acquireLock(selectedFile);
              if (DEBUG_EDITOR) {
                console.log('🔒 Lock acquisition result:', lockAcquired);
              }
            }, 1000);
          } else {
            setLoadingContent(false);
          }
          
        } catch (error) {
          console.error('❌ Error during branch switch:', error);
          setLoadingContent(false);
        } finally {
          setLastBranch(currentBranch);
          setIsSwitchingBranch(false);
          if (DEBUG_EDITOR) {
            console.log('✅ Branch switch completed');
          }
        }
      };
      
      handleBranchSwitch();
    }
  }, [currentBranch, lastBranch, selectedFile, localContent, lockManager, contentManager, branchContentStore]);

  const loadFileContent = async (filePath: string) => {
    setLoadingContent(true);
    
    try {
      // First check branch content store
      let content = branchContentStore.getContent(currentBranch, filePath);
      
      if (content !== null) {
        if (DEBUG_EDITOR) {
          console.log('📄 Found content in branch store for:', filePath);
        }
        setLocalContent(content);
      } else {
        // Load from database/filesystem
        content = await contentManager.loadContent(filePath);
        
        if (content !== null) {
          setLocalContent(content);
          // Cache in branch store
          branchContentStore.setContent(currentBranch, filePath, content);
          if (DEBUG_EDITOR) {
            console.log('📄 Loaded and cached content for:', filePath, 'in branch:', currentBranch);
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
          branchContentStore.setContent(currentBranch, filePath, defaultContent);
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setLocalContent("Error loading file content");
    } finally {
      setLoadingContent(false);
    }
  };

  // Auto-save with branch isolation
  useEffect(() => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent && !isSwitchingBranch) {
      // Save to branch store immediately for isolation
      branchContentStore.setContent(currentBranch, selectedFile, localContent);
      // Also save to database
      contentManager.saveContent(selectedFile, localContent, false);
    }
  }, [selectedFile, localContent, lockManager, contentManager, branchContentStore, currentBranch, isSwitchingBranch]);

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
      console.log('=== FILE SELECTION ===', filePath, 'in branch:', currentBranch);
    }
    
    // Save current file content to branch store before switching
    if (selectedFile && localContent) {
      branchContentStore.captureCurrentContent(currentBranch, selectedFile, localContent);
      
      // Also save to database if we have lock
      if (lockManager.isFileLockedByMe(selectedFile)) {
        await contentManager.saveContent(selectedFile, localContent, true);
      }
    }
    
    // Set the new file first
    setSelectedFile(filePath);
    await loadFileContent(filePath);
    
    // Acquire lock for new file
    if (DEBUG_EDITOR) {
      console.log('🔒 Acquiring lock for new file:', filePath);
    }
    
    const lockAcquired = await lockManager.acquireLock(filePath);
    
    if (DEBUG_EDITOR) {
      console.log('🔒 Lock acquisition result:', lockAcquired);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && !isSwitchingBranch) {
      setLocalContent(newContent);
      // Immediately save to branch store for isolation
      branchContentStore.setContent(currentBranch, selectedFile, newContent);
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
