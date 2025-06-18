
import { useState } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useBranchManager } from "@/hooks/useBranchManager";
import { useBranchSessions } from "@/hooks/useBranchSessions";
import { useBranchEditorWithUrl } from "@/hooks/useBranchEditorWithUrl";
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
  
  // Use the URL-aware branch editor
  const editor = useBranchEditorWithUrl();
  
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [fileVisibility, setFileVisibility] = useState<{[filePath: string]: boolean}>({});

  // Get current file's visibility state
  const currentFileVisibility = editor.selectedFile ? 
    fileVisibility[editor.selectedFile] ?? true : true;

  // Handle visibility change
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="text-center space-y-6 p-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-300 dark:border-r-purple-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Loading Editor</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm">Preparing your workspace with all the tools you need...</p>
            <div className="flex items-center justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950 dark:via-red-900 dark:to-orange-950">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Failed to Load Editor</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{error.message}</p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="gap-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
          >
            🔄 Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalLiveFiles = sessions.filter(s => s.content && s.content.trim()).length;
  const hasChanges = editor.selectedFile ? editor.localContent !== "" : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
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
            branches={branches}
          />
          
          {/* Enhanced loading overlay */}
          {editor.isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center">
              <div className="text-center space-y-4 p-6 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
                  <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-r-purple-300 dark:border-r-purple-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Loading content...</p>
              </div>
            </div>
          )}
          
          {/* Tab Content with enhanced styling */}
          <div className="flex-1 overflow-hidden flex">
            {activeTab === 'navigation' ? (
              <>
                <FileTreeSidebar
                  title="Navigation Structure"
                  description="Manage the navigation hierarchy"
                  selectedFile={editor.selectedFile}
                  onFileSelect={editor.selectFile}
                  fileStructure={fileStructure}
                />
                <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-500 ease-out">
                  <NavigationEditor 
                    fileStructure={fileStructure} 
                    onNavigationChange={refetch}
                  />
                </div>
              </>
            ) : activeTab === 'seo' ? (
              <div className="flex-1 animate-in fade-in slide-in-from-top-2 duration-500 ease-out">
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
                />
                <div className="flex-1 animate-in fade-in-from-bottom-2 duration-500 ease-out">
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
