
import { useState, useEffect, useRef, useCallback } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLockManager } from "@/hooks/useLockManager";
import { useContentManager } from "@/hooks/useContentManager";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { useContentStore } from "@/hooks/useContentStore";
import { NavigationEditor } from "./NavigationEditor";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { Button } from "@/components/ui/button";
import { EditorMainHeader } from "./EditorMainHeader";
import { NewEditorTabNavigation } from "./NewEditorTabNavigation";
import { EditorOperations } from "@/utils/editorOperations";

const DEBUG_EDITOR = true;

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { currentBranch, initialized, branches } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);

  // Core systems
  const lockManager = useLockManager();
  const contentManager = useContentManager(lockManager);
  const contentStore = useContentStore();

  // UI State - completely simplified
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

  // Simple auto-save with no blocking states
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (!selectedFile || !lockManager.isFileLockedByMe(selectedFile) || !localContent.trim()) {
      return;
    }

    // Don't auto-save if already saving
    if (EditorOperations.isOperationActive('save')) {
      return;
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && !EditorOperations.isOperationActive('save')) {
        EditorOperations.startOperation('save');
        
        try {
          // Update content store immediately
          contentStore.setContent(currentBranch, selectedFile, localContent);
          // Save to database
          await contentManager.saveContentToBranch(selectedFile, localContent, currentBranch);
          
          EditorOperations.endOperation('save', true, 'Changes auto-saved');
        } catch (error) {
          log('❌ Auto-save failed', error);
          EditorOperations.endOperation('save', false, 'Auto-save failed');
        }
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedFile, localContent, currentBranch, lockManager, contentManager, contentStore, log]);

  // Simple branch switching
  useEffect(() => {
    if (!currentBranch) return;
    
    if (lastBranch === null) {
      setLastBranch(currentBranch);
      return;
    }
    
    if (currentBranch !== lastBranch) {
      handleBranchSwitch(lastBranch, currentBranch);
    }
  }, [currentBranch, lastBranch]);

  const handleBranchSwitch = async (fromBranch: string, toBranch: string) => {
    log('🔄 Branch switch detected', { from: fromBranch, to: toBranch });
    
    EditorOperations.startOperation('branch-switch', `Switching from ${fromBranch} to ${toBranch}`);
    
    try {
      // Step 1: Save current content if needed
      const currentEditorContent = localContent;
      if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && currentEditorContent.trim()) {
        log('📸 Capturing content snapshot for old branch');
        contentStore.captureSnapshot(fromBranch, selectedFile, currentEditorContent);
        
        // Save to old branch
        log('💾 Saving to old branch');
        await contentManager.saveContentToBranch(selectedFile, currentEditorContent, fromBranch);
        contentStore.setContent(fromBranch, selectedFile, currentEditorContent);
      }
      
      // Step 2: Release locks
      if (lockManager.myCurrentLock) {
        log('🔓 Releasing locks');
        await lockManager.releaseLock(lockManager.myCurrentLock);
      }
      
      // Step 3: Clear current content
      setLocalContent("");
      
      // Step 4: Load content for new branch
      if (selectedFile) {
        await loadContentForBranch(selectedFile, toBranch);
        
        // Acquire lock for new branch
        setTimeout(async () => {
          await lockManager.acquireLock(selectedFile);
        }, 100);
      }
      
      setLastBranch(toBranch);
      EditorOperations.endOperation('branch-switch', true, `Switched to ${toBranch}`);
    } catch (error) {
      log('❌ Branch switch failed', error);
      EditorOperations.endOperation('branch-switch', false, 'Failed to switch branches');
    }
  };

  const loadContentForBranch = async (filePath: string, branchName: string) => {
    log('📄 Loading content for branch', { filePath, branchName });
    
    // Check content store first
    let content = contentStore.getContent(branchName, filePath);
    
    if (!content) {
      // Load from database
      content = await contentManager.loadContentForced(filePath, branchName);
      
      if (content) {
        contentStore.setContent(branchName, filePath, content);
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

This content is specific to the ${branchName} branch.

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`;
        contentStore.setContent(branchName, filePath, content);
      }
    }
    
    // Update editor content immediately
    setLocalContent(content || "");
    return content;
  };

  const loadFileContent = async (filePath: string) => {
    log('📂 Starting file load', { filePath, branch: currentBranch });
    
    EditorOperations.startOperation('load-file', 'Loading file content...');
    
    try {
      const content = await loadContentForBranch(filePath, currentBranch);
      log('📂 File loaded successfully', { length: content?.length });
      EditorOperations.endOperation('load-file', true);
      return content;
    } catch (error) {
      log('❌ Error loading file content', error);
      setLocalContent("Error loading file content");
      EditorOperations.endOperation('load-file', false, 'Failed to load file');
      throw error;
    }
  };

  const handleContentChange = (newContent: string) => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
      setLocalContent(newContent);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (selectedFile === filePath) return;

    log('📁 File selection', { filePath, currentBranch });
    
    // Save current file if needed
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent) {
      contentStore.setContent(currentBranch, selectedFile, localContent);
      await contentManager.saveContent(selectedFile, localContent, true);
    }
    
    setSelectedFile(filePath);
    
    // Load content
    try {
      await loadFileContent(filePath);
      
      // Acquire lock
      const lockAcquired = await lockManager.acquireLock(filePath);
      log('🔒 Lock acquisition', { filePath, success: lockAcquired });
    } catch (error) {
      log('❌ Error loading file', error);
      setLocalContent("Error loading file content");
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
      EditorOperations.startOperation('manual-save', 'Saving changes...');
      
      try {
        contentStore.setContent(currentBranch, selectedFile, localContent);
        await contentManager.saveContent(selectedFile, localContent, true);
        EditorOperations.endOperation('manual-save', true, 'Changes saved successfully');
      } catch (error) {
        log('❌ Manual save failed', error);
        EditorOperations.endOperation('manual-save', false, 'Failed to save changes');
      }
    }
  };

  // Cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lockManager.myCurrentLock) {
        lockManager.releaseLock(lockManager.myCurrentLock);
      }
      EditorOperations.clearAllOperations();
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
      EditorOperations.clearAllOperations();
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
                    saving={contentManager.isAutoSaving || EditorOperations.isOperationActive('save')}
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
