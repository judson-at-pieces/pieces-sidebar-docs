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
      console.log('Loading content for file:', filePath);
      
      // Load from the public/content directory where the actual markdown files are
      const response = await fetch(`/content/${filePath}`);
      if (response.ok) {
        const fileContent = await response.text();
        console.log('Successfully loaded content for:', filePath);
        setContent(fileContent);
      } else {
        console.log(`File not found at /content/${filePath}, creating new content`);
        // Create default content for new files with proper TSX structure
        const cleanPath = filePath.replace(/\.md$/, '');
        const fileName = cleanPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
        
        setContent(`---
title: "${fileName}"
path: "/${cleanPath}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

<h1>${fileName}</h1>

<p>Add your content here. You can use TSX components like:</p>

<Callout type="info">
  This is an information callout. Type "/" to see more available components.
</Callout>

<p>Start editing to see the live preview!</p>
`);
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      // Create default content for new files
      const cleanPath = filePath.replace(/\.md$/, '');
      const fileName = cleanPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
      
      setContent(`---
title: "${fileName}"
path: "/${cleanPath}"
visibility: "PUBLIC"
description: "Add a description for this page"
---

<h1>${fileName}</h1>

<p>Add your content here. You can use TSX components like:</p>

<Callout type="info">
  This is an information callout. Type "/" to see more available components.
</Callout>

<p>Start editing to see the live preview!</p>
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
    
    // Trigger recompilation after save
    console.log('Content saved, triggering recompilation...');
    // This is where you could trigger your MDX compiler
    // You might want to call your build script or trigger a rebuild
  };

  const handleCreateFile = (fileName: string, parentPath?: string) => {
    console.log('Creating file:', fileName, 'in:', parentPath);
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
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-semibold text-lg">Pieces Docs</span>
            </Link>
            <div className="h-6 w-px bg-border/50"></div>
            <h1 className="text-xl font-semibold text-muted-foreground">Editor</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            {hasRole('admin') && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-4rem)]">
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
          <div className="border-b border-border/50 p-3 bg-background">
            <div className="flex space-x-1">
              <Button
                onClick={() => setActiveTab('navigation')}
                variant={activeTab === 'navigation' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Navigation
              </Button>
              <Button
                onClick={() => setActiveTab('content')}
                variant={activeTab === 'content' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
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
