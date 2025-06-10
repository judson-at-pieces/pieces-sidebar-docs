import { useState, useEffect } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLiveEditing } from "@/hooks/useLiveEditing";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { NavigationEditor } from "./NavigationEditor";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { Button } from "@/components/ui/button";
import { EditorMainHeader } from "./EditorMainHeader";
import { NewEditorTabNavigation } from "./NewEditorTabNavigation";

const DEBUG_MARKDOWN = false;

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { currentBranch, initialized, branches } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);

  console.log('🔵 EDITOR LAYOUT: Using useBranchManager only:', {
    currentBranch: JSON.stringify(currentBranch),
    initialized,
    branchesCount: branches.length
  });

  const [selectedFile, setSelectedFile] = useState<string>();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [loadingContent, setLoadingContent] = useState(false);

  // Live editing hook
  const {
    isLocked,
    lockedBy,
    liveContent,
    isAcquiringLock,
    acquireLock,
    releaseLock,
    saveLiveContent,
    loadLiveContent,
  } = useLiveEditing(selectedFile, currentBranch);

  // Clear local state when branch changes
  useEffect(() => {
    if (currentBranch) {
      if (DEBUG_MARKDOWN) {
        console.log('🔄 Branch changed, clearing local state for:', currentBranch);
      }
      setSelectedFile(undefined);
      setContent("");
      setHasChanges(false);
    }
  }, [currentBranch]);

  // Auto-save live content when user has the lock
  useEffect(() => {
    if (selectedFile && isLocked && lockedBy === 'You' && hasChanges && content && currentBranch) {
      const timeoutId = setTimeout(() => {
        if (DEBUG_MARKDOWN) {
          console.log('Auto-saving live content for file:', selectedFile, 'on branch:', currentBranch);
        }
        saveLiveContent(selectedFile, content);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedFile, isLocked, lockedBy, hasChanges, content, currentBranch, saveLiveContent]);

  const handleFileSelect = async (filePath: string) => {
    if (DEBUG_MARKDOWN) {
      console.log('=== FILE SELECTION ===');
      console.log('Selected file:', filePath);
      console.log('Current branch:', currentBranch);
    }
    
    // Release lock on previous file if user owns it
    if (selectedFile && isLocked && lockedBy === 'You') {
      if (DEBUG_MARKDOWN) {
        console.log('Releasing lock on previous file:', selectedFile);
      }
      await releaseLock(selectedFile);
    }
    
    setSelectedFile(filePath);
    setHasChanges(false);
    setLoadingContent(true);

    try {
      // Check if there's live content for this file first
      const liveFileContent = await loadLiveContent(filePath);
      
      if (liveFileContent) {
        if (DEBUG_MARKDOWN) {
          console.log('Found live content for:', filePath);
        }
        setContent(liveFileContent);
        setLoadingContent(false);
        // Try to acquire lock automatically
        setTimeout(() => acquireLock(filePath), 100);
        return;
      }

      // Load from file system
      let fetchPath = filePath;
      if (!fetchPath.endsWith('.md')) {
        fetchPath = `${fetchPath}.md`;
      }
      
      const cleanFetchPath = fetchPath.replace(/^\/+/, '');
      const fetchUrl = `/content/${cleanFetchPath}`;
      
      if (DEBUG_MARKDOWN) {
        console.log('Fetching from URL:', fetchUrl);
      }
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/markdown, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      const responseText = await response.text();
      
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
        console.error('ERROR: Received HTML instead of markdown for:', fetchUrl);
        throw new Error('Server returned HTML instead of markdown file');
      }
      
      if (response.ok && responseText.length > 0) {
        if (DEBUG_MARKDOWN) {
          console.log('Successfully loaded content for:', filePath);
        }
        setContent(responseText);
      } else {
        if (DEBUG_MARKDOWN) {
          console.log('File not found, creating default content for:', filePath);
        }
        const fileName = filePath.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
        const pathForFrontmatter = filePath.replace(/\.md$/, '').replace(/^\//, '');
        
        const defaultContent = `---
title: "${fileName}"
path: "/${pathForFrontmatter}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

# ${fileName}

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`;
        setContent(defaultContent);
      }
      
      // Try to acquire lock automatically
      setTimeout(() => acquireLock(filePath), 100);
      
    } catch (error) {
      console.error('=== ERROR LOADING FILE ===');
      console.error('File path:', filePath);
      console.error('Error:', error);
      
      // Create default content on error
      const fileName = filePath.split('/').pop()?.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
      const pathForFrontmatter = filePath.replace(/\.md$/, '').replace(/^\//, '');
      
      const defaultContent = `---
title: "${fileName}"
path: "/${pathForFrontmatter}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

# ${fileName}

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`;
      setContent(defaultContent);
      
      // Try to acquire lock automatically even on error
      setTimeout(() => acquireLock(filePath), 100);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    // Allow content changes if user has the lock
    if (isLocked && lockedBy === 'You') {
      setContent(newContent);
      setHasChanges(true);
    }
  };

  const handleAcquireLock = async () => {
    if (selectedFile && currentBranch) {
      if (DEBUG_MARKDOWN) {
        console.log('Manually acquiring lock for:', selectedFile, 'on branch:', currentBranch);
      }
      const success = await acquireLock(selectedFile);
      if (success && DEBUG_MARKDOWN) {
        console.log('Lock acquired for editing:', selectedFile);
      }
    }
  };

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
            lockedBy={lockedBy}
            isAcquiringLock={isAcquiringLock}
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
                  title="Content Files"
                  description="Select a file to edit its content"
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  fileStructure={fileStructure}
                  pendingChanges={sessions.map(s => s.file_path)}
                  liveSessions={sessions}
                />
                <div className="flex-1 animate-in fade-in-from-bottom-2 duration-300">
                  <EditorMain 
                    selectedFile={selectedFile}
                    content={loadingContent ? "Loading content..." : content}
                    onContentChange={handleContentChange}
                    onSave={() => {}}
                    hasChanges={hasChanges}
                    saving={false}
                    isLocked={isLocked}
                    lockedBy={lockedBy}
                    liveContent={liveContent}
                    isAcquiringLock={isAcquiringLock}
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
