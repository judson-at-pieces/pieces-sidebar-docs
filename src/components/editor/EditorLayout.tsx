
import { useState } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { NavigationEditor } from "./NavigationEditor";
import { EditorSidebar } from "./EditorSidebar";
import { EditorMain } from "./EditorMain";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { Settings, FileText, Navigation, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { hasRole } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string>();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'navigation' | 'content'>('navigation');
  const [loadingContent, setLoadingContent] = useState(false);

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setHasChanges(false);
    setLoadingContent(true);
    
    try {
      console.log('Loading markdown content for file:', filePath);
      
      // Try to load the raw markdown file from the content directory
      const response = await fetch(`/content/${filePath}`);
      if (response.ok) {
        const markdownContent = await response.text();
        console.log('Successfully loaded markdown content for:', filePath);
        setContent(markdownContent);
      } else {
        console.log(`Markdown file not found at /content/${filePath}, creating new markdown content`);
        // Create default markdown content for new files
        const cleanPath = filePath.replace(/\.md$/, '');
        const fileName = cleanPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
        
        setContent(`---
title: "${fileName}"
path: "/${cleanPath}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

# ${fileName}

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`);
      }
    } catch (error) {
      console.error('Error loading markdown content:', error);
      // Create default markdown content for new files
      const cleanPath = filePath.replace(/\.md$/, '');
      const fileName = cleanPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
      
      setContent(`---
title: "${fileName}"
path: "/${cleanPath}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

# ${fileName}

Add your content here. You can use markdown and custom components:

:::info
This is an information callout. Type "/" to see more available components.
:::

Start editing to see the live preview!
`);
    } finally {
      setLoadingContent(false);
    }
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
    
    console.log('Markdown content saved, will be compiled on PR merge');
  };

  const handleCreateFile = (fileName: string, parentPath?: string) => {
    console.log('Creating markdown file:', fileName, 'in:', parentPath);
    const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const filePath = fullPath.endsWith('.md') ? fullPath : `${fullPath}.md`;
    
    // Automatically select the new file and set up initial content
    handleFileSelect(filePath);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load editor: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Only show when NOT in navigation tab */}
      {activeTab !== 'navigation' && (
        <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">P</span>
                </div>
                <span className="font-semibold">Pieces Docs</span>
              </Link>
              <div className="h-4 w-px bg-border/50"></div>
              <span className="text-sm text-muted-foreground">Content Editor</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 h-8">
                  <Home className="h-3 w-3" />
                  Home
                </Button>
              </Link>
              {hasRole('admin') && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <Settings className="h-3 w-3" />
                    Admin
                  </Button>
                </Link>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <div className="w-72 border-r border-border/50 bg-muted/20">
          <EditorSidebar
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            modifiedFiles={modifiedFiles}
            onCreateFile={handleCreateFile}
            fileStructure={fileStructure}
            isLoading={false}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border/50 p-3 bg-background/95 backdrop-blur-sm">
            <div className="flex space-x-1">
              <Button
                onClick={() => setActiveTab('navigation')}
                variant={activeTab === 'navigation' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2 h-8"
              >
                <Navigation className="h-3 w-3" />
                Navigation
              </Button>
              <Button
                onClick={() => setActiveTab('content')}
                variant={activeTab === 'content' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2 h-8"
              >
                <FileText className="h-3 w-3" />
                Content
              </Button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'navigation' ? (
              <NavigationEditor 
                fileStructure={fileStructure} 
                onNavigationChange={refetch}
              />
            ) : (
              <EditorMain 
                selectedFile={selectedFile}
                content={loadingContent ? "Loading..." : content}
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
