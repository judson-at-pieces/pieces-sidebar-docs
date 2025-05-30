
import { useState } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { NavigationEditor } from "./NavigationEditor";
import { EditorSidebar } from "./EditorSidebar";
import { EditorMain } from "./EditorMain";

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const [selectedFile, setSelectedFile] = useState<string>();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'navigation' | 'content'>('navigation');

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    setContent("");
    setHasChanges(false);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
    if (selectedFile) {
      setModifiedFiles(prev => new Set(prev).add(selectedFile));
    }
  };

  const handleSave = () => {
    setHasChanges(false);
    if (selectedFile) {
      setModifiedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedFile);
        return newSet;
      });
    }
  };

  const handleCreateFile = (fileName: string, parentPath?: string) => {
    console.log('Creating file:', fileName, 'in:', parentPath);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load editor: {error.message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Documentation Editor</h1>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-64 border-r">
          <EditorSidebar
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            modifiedFiles={modifiedFiles}
            onCreateFile={handleCreateFile}
            fileStructure={fileStructure}
            isLoading={false}
          />
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="border-b p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('navigation')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'navigation' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Navigation
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'content' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Content
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'navigation' ? (
              <NavigationEditor 
                fileStructure={fileStructure} 
                onNavigationChange={refetch}
              />
            ) : (
              <EditorMain 
                selectedFile={selectedFile}
                content={content}
                onContentChange={handleContentChange}
                onSave={handleSave}
                hasChanges={hasChanges}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
