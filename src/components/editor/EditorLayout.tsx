import { useState } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { NavigationEditor } from "./NavigationEditor";
import { EditorSidebar } from "./EditorSidebar";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { Settings, FileText, Navigation, Home, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { hasRole } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string>();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [loadingContent, setLoadingContent] = useState(false);

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setHasChanges(false);
    setLoadingContent(true);
    
    try {
      console.log('=== FILE SELECTION DEBUG ===');
      console.log('Original filePath:', filePath);
      
      // Ensure the file path has .md extension and is properly formatted
      let markdownPath = filePath;
      if (!markdownPath.endsWith('.md')) {
        markdownPath = `${filePath}.md`;
      }
      
      // Remove any leading slashes and ensure it's relative to content directory
      markdownPath = markdownPath.replace(/^\/+/, '');
      
      const fetchUrl = `/content/${markdownPath}`;
      console.log('Constructed fetch URL:', fetchUrl);
      console.log('Full URL will be:', window.location.origin + fetchUrl);
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/markdown, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response content-type:', response.headers.get('content-type'));
      
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview (first 500 chars):', responseText.substring(0, 500));
      
      // Check if response looks like HTML (indicating wrong file was served)
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
        console.error('ERROR: Received HTML instead of markdown!');
        console.error('This means the server is serving index.html instead of the markdown file');
        throw new Error('Server returned HTML instead of markdown file');
      }
      
      if (response.ok && responseText.length > 0) {
        console.log('Successfully loaded markdown content for:', markdownPath);
        setContent(responseText);
      } else {
        console.log(`Markdown file not found or empty at ${fetchUrl}`);
        // Create default markdown content for new files
        const cleanPath = markdownPath.replace(/\.md$/, '');
        const fileName = cleanPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
        
        const defaultContent = `---
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
`;
        console.log('Setting default markdown content for new file');
        setContent(defaultContent);
      }
    } catch (error) {
      console.error('=== ERROR LOADING MARKDOWN ===');
      console.error('Error details:', error);
      
      // Create default markdown content for new files
      const cleanPath = filePath.replace(/\.md$/, '');
      const fileName = cleanPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Page';
      
      const defaultContent = `---
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
`;
      console.log('Setting default content due to error');
      setContent(defaultContent);
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

  const handleSeoDataChange = (seoData: any) => {
    console.log('SEO data updated for:', selectedFile, seoData);
    // Here you would typically save the SEO data to your backend or local storage
    // For now, we'll just log it
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Enhanced Header - Hide completely when in navigation tab */}
      {activeTab === 'content' && (
        <div className="border-b border-border/50 bg-background/95 backdrop-blur-md shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Pieces Docs</span>
              </Link>
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h1 className="text-lg font-medium text-muted-foreground">Content Editor</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50 transition-colors">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              {hasRole('admin') && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-muted/50 transition-colors">
                    <Settings className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      )}
      
      <div className={`flex ${activeTab === 'content' ? 'h-[calc(100vh-4rem)]' : 'h-screen'}`}>
        {/* Enhanced Sidebar - Hide when in navigation tab */}
        {activeTab === 'content' && (
          <div className="w-80 border-r border-border/50 bg-muted/20 backdrop-blur-sm">
            <EditorSidebar
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              modifiedFiles={modifiedFiles}
              onCreateFile={handleCreateFile}
              fileStructure={fileStructure}
              isLoading={false}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Tab Navigation */}
          <div className="border-b border-border/50 px-6 py-4 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
                <Button
                  onClick={() => setActiveTab('navigation')}
                  variant={activeTab === 'navigation' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2 transition-all duration-200"
                >
                  <Navigation className="h-4 w-4" />
                  Navigation
                </Button>
                <Button
                  onClick={() => setActiveTab('content')}
                  variant={activeTab === 'content' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2 transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  Content
                </Button>
                <Button
                  onClick={() => setActiveTab('seo')}
                  variant={activeTab === 'seo' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2 transition-all duration-200"
                >
                  <Search className="h-4 w-4" />
                  SEO
                </Button>
              </div>
              
              {activeTab === 'content' && modifiedFiles.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  {modifiedFiles.size} file{modifiedFiles.size !== 1 ? 's' : ''} modified
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'navigation' ? (
              <div className="h-full animate-in fade-in slide-in-from-top-2 duration-300">
                <NavigationEditor 
                  fileStructure={fileStructure} 
                  onNavigationChange={refetch}
                />
              </div>
            ) : activeTab === 'seo' ? (
              <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
                <SeoEditor
                  selectedFile={selectedFile}
                  onSeoDataChange={handleSeoDataChange}
                />
              </div>
            ) : (
              <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <EditorMain 
                  selectedFile={selectedFile}
                  content={loadingContent ? "Loading content..." : content}
                  onContentChange={handleContentChange}
                  onSave={handleSave}
                  hasChanges={hasChanges}
                  saving={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
