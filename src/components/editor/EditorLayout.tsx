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
import { getBranchCookie } from "@/utils/branchCookies";

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
  const [lastCookieBranch, setLastCookieBranch] = useState<string | null>(null);

  // Watch for branch cookie changes and only refresh content
  useEffect(() => {
    const checkBranchCookie = () => {
      const cookieBranch = getBranchCookie();
      
      // Only process if we have a valid cookie branch and it's different from what we last saw
      if (cookieBranch && cookieBranch !== lastCookieBranch && initialized) {
        if (DEBUG_EDITOR) {
          console.log('🔄 BRANCH COOKIE CHANGED - REFRESHING CONTENT ONLY:', lastCookieBranch, '->', cookieBranch);
        }
        
        // Update our tracking
        setLastCookieBranch(cookieBranch);
        
        // Force refresh content for the new branch
        contentManager.refreshContentForBranch(cookieBranch);
        
        // If we have a selected file, reload its content for the new branch
        if (selectedFile) {
          loadFileContent(selectedFile);
        }
        
        // Release any current locks (but keep the file selected)
        if (lockManager.myCurrentLock) {
          lockManager.releaseLock(lockManager.myCurrentLock);
        }
      } else if (cookieBranch && lastCookieBranch === null) {
        // Initial setup
        setLastCookieBranch(cookieBranch);
      }
    };

    // Check immediately
    checkBranchCookie();
    
    // Poll for cookie changes every 500ms (less aggressive)
    const interval = setInterval(checkBranchCookie, 500);
    
    return () => clearInterval(interval);
  }, [lastCookieBranch, initialized, contentManager, lockManager, selectedFile]);

  const loadFileContent = async (filePath: string) => {
    setLoadingContent(true);
    
    try {
      // Force load content bypassing cache
      const content = await contentManager.loadContentForced(filePath, currentBranch);
      
      if (content !== null) {
        setLocalContent(content);
        if (DEBUG_EDITOR) {
          console.log('📄 Force loaded content for:', filePath, 'in branch:', currentBranch);
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

  // Auto-save when user has the lock and content changes
  useEffect(() => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent) {
      contentManager.saveContent(selectedFile, localContent, false);
    }
  }, [selectedFile, localContent, lockManager, contentManager]);

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
    
    // Save current file content before switching
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile) && localContent) {
      await contentManager.saveContent(selectedFile, localContent, true);
    }
    
    // Release current lock before switching files
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
      await lockManager.releaseLock(selectedFile);
    }
    
    setSelectedFile(filePath);
    await loadFileContent(filePath);
    
    // Try to acquire lock for new file
    setTimeout(() => {
      lockManager.acquireLock(filePath);
    }, 100);
  };

  const handleContentChange = (newContent: string) => {
    if (selectedFile && lockManager.isFileLockedByMe(selectedFile)) {
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
