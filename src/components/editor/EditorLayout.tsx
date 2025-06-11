
import { useState, useEffect, useRef } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLockManager } from "@/hooks/useLockManager";
import { useContentManager } from "@/hooks/useContentManager";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { useEditorStateMachine } from "@/hooks/useEditorStateMachine";
import { useContentStore } from "@/hooks/useContentStore";
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

  // Core systems
  const lockManager = useLockManager();
  const contentManager = useContentManager(lockManager);
  const stateMachine = useEditorStateMachine();
  const contentStore = useContentStore();

  // UI State
  const [selectedFile, setSelectedFile] = useState<string>();
  const [localContent, setLocalContent] = useState("");
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [lastBranch, setLastBranch] = useState<string | null>(null);

  // Refs for tracking
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const log = useCallback((message: string, data?: any) => {
    if (DEBUG_EDITOR) {
      console.log(`🎯 [Editor] ${message}`, data || '');
    }
  }, []);

  // Auto-save with state machine protection
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Block auto-save if state machine is busy or no content
    if (stateMachine.isBlocked() || !selectedFile || !lockManager.isFileLockedByMe(selectedFile) || !localContent.trim()) {
      return;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!stateMachine.isBlocked() && selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
        log('💾 Auto-saving');
        
        stateMachine.queueOperation('save', {
          saveFunction: async () => {
            // Update content store immediately
            contentStore.setContent(currentBranch, selectedFile, localContent);
            // Save to database
            return contentManager.saveContentToBranch(selectedFile, localContent, currentBranch);
          }
        });
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedFile, localContent, currentBranch, stateMachine, lockManager, contentManager, contentStore, log]);

  // Branch switching with state machine
  useEffect(() => {
    if (!currentBranch) return;
    
    if (lastBranch === null) {
      setLastBranch(currentBranch);
      return;
    }
    
    if (currentBranch !== lastBranch) {
      log('🔄 Branch switch detected', { from: lastBranch, to: currentBranch });
      
      stateMachine.queueOperation('switch_branch', {
        switchFunction: async () => {
          // Step 1: Capture current content snapshot
          const currentEditorContent = localContent;
          if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && currentEditorContent.trim()) {
            log('📸 Capturing content snapshot for old branch');
            contentStore.captureSnapshot(lastBranch, selectedFile, currentEditorContent);
            
            // Save to old branch
            log('💾 Saving to old branch');
            await contentManager.saveContentToBranch(selectedFile, currentEditorContent, lastBranch);
            contentStore.setContent(lastBranch, selectedFile, currentEditorContent);
          }
          
          // Step 2: Release locks
          if (lockManager.myCurrentLock) {
            log('🔓 Releasing locks');
            await lockManager.releaseLock(lockManager.myCurrentLock);
          }
          
          // Step 3: Clear current content immediately
          setLocalContent("");
          
          return true;
        },
        loadFunction: async () => {
          // Step 4: Load content for new branch
          if (selectedFile) {
            log('📄 Loading content for new branch');
            
            // Check content store first
            let newContent = contentStore.getContent(currentBranch, selectedFile);
            
            if (!newContent) {
              // Load from database
              newContent = await contentManager.loadContentForced(selectedFile, currentBranch);
              
              if (newContent) {
                contentStore.setContent(currentBranch, selectedFile, newContent);
              } else {
                // Create default content
                const fileName = selectedFile.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
                const pathForFrontmatter = selectedFile.replace(/\.md$/, '').replace(/^\//, '');
                
                newContent = `---
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
                contentStore.setContent(currentBranch, selectedFile, newContent);
              }
            }
            
            // Update editor content
            setLocalContent(newContent || "");
            
            // Acquire lock for new branch
            setTimeout(async () => {
              await lockManager.acquireLock(selectedFile);
            }, 100);
          }
          
          setLastBranch(currentBranch);
          return true;
        }
      });
    }
  }, [currentBranch, lastBranch, selectedFile, localContent, lockManager, contentManager, contentStore, stateMachine, log]);

  const loadFileContent = async (filePath: string) => {
    return stateMachine.queueOperation('load_file', {
      loadFunction: async () => {
        log('📂 Loading file content', { filePath, branch: currentBranch });
        
        // Check content store first
        let content = contentStore.getContent(currentBranch, filePath);
        
        if (!content) {
          // Load from database/filesystem
          content = await contentManager.loadContent(filePath);
          
          if (content) {
            contentStore.setContent(currentBranch, filePath, content);
          } else {
            // Create default content
            const fileName = filePath.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
            const pathForFrontmatter = filePath.replace(/\.md$/, '').replace(/^\//, '');
            
            content = `---
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
            contentStore.setContent(currentBranch, filePath, content);
          }
        }
        
        setLocalContent(content || "");
        return content;
      }
    });
  };

  const handleContentChange = (newContent: string) => {
    if (stateMachine.isBlocked()) {
      log('🚫 Content change blocked - state machine busy');
      return;
    }
    
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
      setLocalContent(newContent);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (selectedFile === filePath || stateMachine.isBlocked()) return;

    log('📁 File selection', { filePath, currentBranch });
    
    // Save current file if needed
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent) {
      contentStore.setContent(currentBranch, selectedFile, localContent);
      await contentManager.saveContent(selectedFile, localContent, true);
    }
    
    setSelectedFile(filePath);
    await loadFileContent(filePath);
    
    // Acquire lock
    const lockAcquired = await lockManager.acquireLock(filePath);
    log('🔒 Lock acquisition', { filePath, success: lockAcquired });
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
      return stateMachine.queueOperation('save', {
        saveFunction: async () => {
          contentStore.setContent(currentBranch, selectedFile, localContent);
          return contentManager.saveContent(selectedFile, localContent, true);
        }
      });
    }
  };

  // Cleanup
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

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [lockManager]);

  // Derive state
  const isLocked = selectedFile ? lockManager.isFileLocked(selectedFile) : false;
  const lockedByMe = selectedFile ? lockManager.isFileLockedByMe(selectedFile) : false;
  const lockedByOther = selectedFile ? lockManager.isFileLockedByOther(selectedFile) : false;
  const lockedByName = selectedFile ? lockManager.getFileLockOwnerName(selectedFile) : null;
  const hasChanges = selectedFile ? contentStore.hasUnsavedChanges(currentBranch, selectedFile, localContent) : false;
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
          
          {/* Show state machine status */}
          {stateMachine.state !== 'IDLE' && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center space-y-4 p-6 bg-card border rounded-lg shadow-lg">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {stateMachine.state === 'SWITCHING_BRANCH' && 'Switching branches...'}
                    {stateMachine.state === 'LOADING_CONTENT' && 'Loading branch content...'}
                    {stateMachine.state === 'LOADING_FILE' && 'Loading file...'}
                    {stateMachine.state === 'SAVING' && 'Saving content...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Content operations are protected during this process
                  </p>
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
                    content={localContent}
                    onContentChange={handleContentChange}
                    onSave={handleSave}
                    hasChanges={hasChanges}
                    saving={contentManager.isAutoSaving || stateMachine.state === 'SAVING'}
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
