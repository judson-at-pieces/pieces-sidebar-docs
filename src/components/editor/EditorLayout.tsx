
import { useState, useEffect } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { useBranchEditor } from "@/hooks/useBranchEditor";
import { NavigationEditor } from "./NavigationEditor";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { Button } from "@/components/ui/button";
import { EditorMainHeader } from "./EditorMainHeader";
import { NewEditorTabNavigation } from "./NewEditorTabNavigation";
import { navigationService } from "@/services/navigationService";

const DEBUG_EDITOR = true;

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { currentBranch, initialized, branches } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);
  
  // Use the new simplified branch editor
  const editor = useBranchEditor();
  
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [fileVisibility, setFileVisibility] = useState<{[filePath: string]: boolean}>({});
  const [folderVisibility, setFolderVisibility] = useState<{[folderPath: string]: boolean}>({});

  // Load visibility from navigation structure
  useEffect(() => {
    const loadVisibility = async () => {
      try {
        console.log('Loading visibility states from navigation structure...');
        const navStructure = await navigationService.getNavigationStructure();
        if (navStructure?.sections) {
          const fileVis: {[filePath: string]: boolean} = {};
          const folderVis: {[folderPath: string]: boolean} = {};
          
          navStructure.sections.forEach(section => {
            section.items?.forEach(item => {
              const isItemActive = item.is_active === true;
              
              if (item.file_path) {
                // This is a file
                fileVis[item.file_path] = isItemActive;
              } else if (item.href) {
                // This is a folder/directory item
                const folderPath = item.href.replace(/^\//, ''); // Remove leading slash
                folderVis[folderPath] = isItemActive;
                console.log(`Loaded folder visibility: ${folderPath} = ${isItemActive}`);
              }
            });
          });
          
          console.log('Loaded file visibility:', fileVis);
          console.log('Loaded folder visibility:', folderVis);
          setFileVisibility(fileVis);
          setFolderVisibility(folderVis);
        }
      } catch (error) {
        console.error('Failed to load visibility states:', error);
      }
    };

    loadVisibility();
  }, []);

  // Get effective visibility considering parent hierarchy
  const getEffectiveVisibility = (itemPath: string, isFile: boolean = false): boolean => {
    // Start with the item's own visibility (default to true if not set)
    const directVisibility = isFile ? (fileVisibility[itemPath] ?? true) : (folderVisibility[itemPath] ?? true);
    
    // If item is explicitly private, it's private
    if (directVisibility === false) {
      return false;
    }
    
    // Check parent folders - if any parent is private, this item should be hidden
    const pathParts = itemPath.split('/');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('/');
      if (folderVisibility[parentPath] === false) {
        return false; // Parent is private, so this item is effectively private
      }
    }
    
    // Item is public if not explicitly set to private and no private parents
    return true;
  };

  // Get current file's visibility state
  const currentFileVisibility = editor.selectedFile ? 
    getEffectiveVisibility(editor.selectedFile, true) : true;

  // Handle file visibility change
  const handleVisibilityChange = async (isPublic: boolean) => {
    if (!editor.selectedFile) return;

    try {
      // Update local state immediately
      setFileVisibility(prev => ({
        ...prev,
        [editor.selectedFile!]: isPublic
      }));

      // Update the navigation item's is_active status
      await navigationService.updateNavigationItemByFilePath(editor.selectedFile, isPublic);

      console.log(`File ${editor.selectedFile} visibility updated to ${isPublic ? 'visible' : 'hidden'} in navigation`);
    } catch (error) {
      console.error('Failed to update file visibility:', error);
      // Revert local state on error
      setFileVisibility(prev => ({
        ...prev,
        [editor.selectedFile!]: !isPublic
      }));
    }
  };

  // Handle folder visibility changes - refresh all visibility states
  const handleFolderVisibilityChange = async () => {
    try {
      console.log('Refreshing visibility states after folder change...');
      const navStructure = await navigationService.getNavigationStructure();
      if (navStructure?.sections) {
        const fileVis: {[filePath: string]: boolean} = {};
        const folderVis: {[folderPath: string]: boolean} = {};
        
        navStructure.sections.forEach(section => {
          section.items?.forEach(item => {
            const isItemActive = item.is_active === true;
            
            if (item.file_path) {
              // This is a file
              fileVis[item.file_path] = isItemActive;
            } else if (item.href) {
              // This is a folder/directory item
              const folderPath = item.href.replace(/^\//, ''); // Remove leading slash
              folderVis[folderPath] = isItemActive;
            }
          });
        });
        
        console.log('Updated file visibility:', fileVis);
        console.log('Updated folder visibility:', folderVis);
        setFileVisibility(fileVis);
        setFolderVisibility(folderVis);
      }
    } catch (error) {
      console.error('Failed to update visibility states:', error);
    }
    
    refetch();
  };

  if (DEBUG_EDITOR) {
    console.log('🎯 EDITOR LAYOUT STATE:', {
      selectedFile: editor.selectedFile,
      currentBranch: editor.currentBranch,
      isLoading: editor.isLoading,
      isAutoSaving: editor.isAutoSaving,
      isFileLocked: editor.isFileLocked,
      lockOwnerName: editor.lockOwnerName
    });
  }

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
  const hasChanges = editor.selectedFile ? editor.localContent !== "" : false;

  // Convert Branch[] to string[] for the component
  const branchNames = branches.map(branch => branch.name);

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
            selectedFile={editor.selectedFile}
            isLocked={editor.isFileLocked}
            lockedBy={editor.lockOwnerName}
            isAcquiringLock={editor.isLoading}
            onAcquireLock={editor.acquireLock}
            currentBranch={editor.currentBranch}
            sessions={sessions}
            hasChanges={hasChanges}
            initialized={initialized}
            branches={branchNames}
          />
          
          {/* Show loading overlay when loading files */}
          {editor.isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading content...</p>
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
                  selectedFile={editor.selectedFile}
                  onFileSelect={editor.selectFile}
                  fileStructure={fileStructure}
                  onFolderVisibilityChange={handleFolderVisibilityChange}
                  folderVisibility={folderVisibility}
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
                  selectedFile={editor.selectedFile}
                  onSeoDataChange={() => {}}
                  fileStructure={fileStructure}
                  onFileSelect={editor.selectFile}
                />
              </div>
            ) : (
              <>
                <FileTreeSidebar
                  title={`Content Files (${editor.currentBranch})`}
                  description={`Select a file to edit its content in the ${editor.currentBranch} branch`}
                  selectedFile={editor.selectedFile}
                  onFileSelect={editor.selectFile}
                  fileStructure={fileStructure}
                  pendingChanges={sessions.map(s => s.file_path)}
                  liveSessions={sessions}
                  onFolderVisibilityChange={handleFolderVisibilityChange}
                  folderVisibility={folderVisibility}
                />
                <div className="flex-1 animate-in fade-in-from-bottom-2 duration-300">
                  <EditorMain 
                    selectedFile={editor.selectedFile}
                    content={editor.localContent}
                    onContentChange={editor.updateContent}
                    onSave={async () => {}} // Auto-save handles this
                    hasChanges={hasChanges}
                    saving={editor.isAutoSaving}
                    isLocked={editor.isFileLocked}
                    lockedBy={editor.lockOwnerName}
                    liveContent={null} // Not needed with new system
                    isAcquiringLock={editor.isLoading}
                    onTakeLock={editor.acquireLock}
                    isPublic={currentFileVisibility}
                    onVisibilityChange={handleVisibilityChange}
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
