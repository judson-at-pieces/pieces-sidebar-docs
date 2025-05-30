
import { useState } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { NavigationEditor } from "./NavigationEditor";
import { EditorSidebar } from "./EditorSidebar";
import { EditorMain } from "./EditorMain";
import { EditorTabs } from "./EditorTabs";

export function EditorLayout() {
  const [activeTab, setActiveTab] = useState<'navigation' | 'content'>('navigation');
  const { fileStructure, isLoading, error, refetch } = useFileStructure();

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
          <p className="text-destructive">Failed to load editor</p>
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
        <EditorSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <EditorTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'navigation' ? (
              <NavigationEditor 
                fileStructure={fileStructure} 
                onNavigationChange={refetch}
              />
            ) : (
              <EditorMain />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
