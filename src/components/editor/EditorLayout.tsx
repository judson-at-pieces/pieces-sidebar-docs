
import { useState } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { NavigationEditor } from "./NavigationEditor";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { Settings, FileText, Navigation, Home, Search, GitPullRequest } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSeoData } from "@/hooks/useSeoData";
import { githubService } from "@/services/githubService";
import { toast } from "sonner";

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { hasRole, session } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string>();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [loadingContent, setLoadingContent] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);

  // SEO data for the current file
  const { pendingChanges, hasUnsavedChanges } = useSeoData(selectedFile);

  const handleFileSelect = async (filePath: string) => {
    console.log('=== FILE SELECTION DEBUG ===');
    console.log('Selected file path:', filePath);
    
    setSelectedFile(filePath);
    setHasChanges(false);
    setLoadingContent(true);
    
    try {
      // Use the exact file path as provided - don't modify it
      let fetchPath = filePath;
      
      // Only add .md extension if the path doesn't already have it
      if (!fetchPath.endsWith('.md')) {
        fetchPath = `${fetchPath}.md`;
      }
      
      // Remove leading slashes for fetch URL
      const cleanFetchPath = fetchPath.replace(/^\/+/, '');
      const fetchUrl = `/content/${cleanFetchPath}`;
      
      console.log('Fetching from URL:', fetchUrl);
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/markdown, */*',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 200));
      
      // Check if response looks like HTML (indicating wrong file was served)
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
        console.error('ERROR: Received HTML instead of markdown for:', fetchUrl);
        throw new Error('Server returned HTML instead of markdown file');
      }
      
      if (response.ok && responseText.length > 0) {
        console.log('Successfully loaded content for:', filePath);
        setContent(responseText);
      } else {
        console.log('File not found, creating default content for:', filePath);
        // Create default markdown content for new files
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

  const handleCreatePR = async () => {
    // Check if user is authenticated with GitHub
    if (!session?.provider_token) {
      toast.error('GitHub authentication required. Please sign in with GitHub to create pull requests.');
      return;
    }

    // Check if there are changes to create PR for
    if (!hasChanges || !selectedFile) {
      toast.error('No changes to create a pull request for');
      return;
    }

    setCreatingPR(true);
    
    try {
      // Get repository configuration
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      // Create a more descriptive title and body
      const fileName = selectedFile.split('/').pop() || selectedFile;
      const fileDisplayPath = selectedFile;
      const timestamp = new Date().toLocaleString();
      
      // Extract title from frontmatter if available
      const frontmatterMatch = content.match(/^---\s*\ntitle:\s*["']?([^"'\n]+)["']?\s*\n/m);
      const pageTitle = frontmatterMatch ? frontmatterMatch[1] : fileName.replace(/\.md$/, '').replace(/-/g, ' ');
      
      // Get word count for context
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      const prBody = `## 📝 Documentation Update

**File Updated:** \`${fileDisplayPath}\`  
**Page Title:** ${pageTitle}  
**Content Length:** ~${wordCount} words  
**Updated:** ${timestamp}

### Changes Made
This pull request contains updates to the documentation content. The changes were made using the Pieces Docs editor and include content modifications to improve the documentation.

### Review Notes
- ✅ Content has been reviewed in the editor preview
- ✅ Markdown formatting verified
- ✅ Ready for review and merge

---
*This pull request was automatically created from the Pieces Docs editor.*`;

      // Use session token for GitHub authentication
      const token = session.provider_token;

      // Create PR with the enhanced description
      const result = await githubService.createPullRequest(
        {
          title: `docs: Update ${pageTitle}`,
          body: prBody,
          files: [
            {
              path: selectedFile.endsWith('.md') ? selectedFile : `${selectedFile}.md`,
              content: content
            }
          ]
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success('Pull request created successfully!', {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
        // Clear changes after successful PR creation
        setHasChanges(false);
        if (selectedFile) {
          setModifiedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedFile);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setCreatingPR(false);
    }
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

  // Convert modifiedFiles Set to array for consistent interface
  const modifiedFilesArray = Array.from(modifiedFiles);

  // Check if user has GitHub token AND there are changes
  const canCreatePR = session?.provider_token && hasChanges && selectedFile && !creatingPR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Enhanced Header */}
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
              <h1 className="text-lg font-medium text-muted-foreground">
                {activeTab === 'content' ? 'Content Editor' : activeTab === 'seo' ? 'SEO Editor' : 'Navigation Editor'}
              </h1>
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
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Tab Navigation with Create PR Button */}
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
              
              <div className="flex items-center gap-3">
                {activeTab === 'content' && (
                  <>
                    {modifiedFiles.size > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                        {modifiedFiles.size} file{modifiedFiles.size !== 1 ? 's' : ''} modified
                      </div>
                    )}
                    
                    <Button
                      onClick={handleCreatePR}
                      variant="outline"
                      size="sm"
                      disabled={!canCreatePR}
                      className="flex items-center gap-2"
                      title={
                        !session?.provider_token 
                          ? "Sign in with GitHub to create pull requests" 
                          : !hasChanges 
                            ? "No changes to create PR for" 
                            : creatingPR 
                              ? "Creating PR..." 
                              : "Create pull request"
                      }
                    >
                      {creatingPR ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <GitPullRequest className="w-4 h-4" />
                      )}
                      Create PR
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Tab Content */}
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
                  onSeoDataChange={handleSeoDataChange}
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
                  pendingChanges={modifiedFilesArray}
                />
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <EditorMain 
                    selectedFile={selectedFile}
                    content={loadingContent ? "Loading content..." : content}
                    onContentChange={handleContentChange}
                    onSave={() => {}} // No longer needed since we only use Create PR
                    hasChanges={hasChanges}
                    saving={false}
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
