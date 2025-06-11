
import { useState } from "react";
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

const DEBUG_EDITOR = true;

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { currentBranch, initialized, branches } = useBranchManager();
  const { sessions } = useBranchSessions(currentBranch);
  
  // Use the new simplified branch editor
  const editor = useBranchEditor();
  
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');

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
            branches={branches}
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
