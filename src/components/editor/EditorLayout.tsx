import { useState, useEffect } from "react";
import { useFileStructure } from "@/hooks/useFileStructure";
import { useLiveEditing } from "@/hooks/useLiveEditing";
import { NavigationEditor } from "./NavigationEditor";
import { EditorMain } from "./EditorMain";
import { SeoEditor } from "./SeoEditor";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { Settings, FileText, Navigation, Home, Search, GitPullRequest, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSeoData } from "@/hooks/useSeoData";
import { githubService } from "@/services/githubService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BranchSelector } from "./BranchSelector";
import { useBranches } from "@/hooks/useBranches";

export function EditorLayout() {
  const { fileStructure, isLoading, error, refetch } = useFileStructure();
  const { hasRole } = useAuth();
  const branchesHook = useBranches();
  const { currentBranch, branches } = branchesHook;

  const [selectedFile, setSelectedFile] = useState<string>();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'navigation' | 'content' | 'seo'>('content');
  const [loadingContent, setLoadingContent] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Live editing hook - ensure currentBranch is passed correctly
  const {
    isLocked,
    lockedBy,
    liveContent,
    sessions,
    isAcquiringLock,
    acquireLock,
    releaseLock,
    saveLiveContent,
    loadLiveContent
  } = useLiveEditing(selectedFile, currentBranch);

  // SEO data for the current file
  const { pendingChanges, hasUnsavedChanges } = useSeoData(selectedFile);

  // Load existing live editing sessions on mount to restore work state
  useEffect(() => {
    const loadExistingLiveSessions = async () => {
      if (!currentBranch) return;
      
      try {
        console.log('Loading existing live sessions for branch:', currentBranch);
        
        const { data: existingSessions, error } = await supabase
          .from('live_editing_sessions')
          .select('file_path, content, branch_name')
          .not('content', 'is', null)
          .neq('content', '')
          .eq('branch_name', currentBranch);

        if (error) {
          console.error('Error loading existing live sessions:', error);
          return;
        }

        if (existingSessions && existingSessions.length > 0) {
          const filesWithChanges = new Set(existingSessions.map(session => session.file_path));
          setModifiedFiles(filesWithChanges);
          
          console.log('Loaded existing live sessions for branch', currentBranch, ':', existingSessions.length, 'files with uncommitted changes');
        } else {
          console.log('No existing live sessions found for branch:', currentBranch);
          setModifiedFiles(new Set());
        }
      } catch (error) {
        console.error('Error loading existing live sessions:', error);
      }
    };

    loadExistingLiveSessions();
  }, [currentBranch]);

  // Update modified files when sessions change
  useEffect(() => {
    const filesWithLiveContent = new Set(
      sessions
        .filter(session => session.content && session.content.trim())
        .map(session => session.file_path)
    );
    setModifiedFiles(filesWithLiveContent);
    console.log('Updated modified files for branch', currentBranch, ':', filesWithLiveContent.size, 'files');
  }, [sessions, currentBranch]);

  // Auto-save live content when user is editing (has the lock)
  useEffect(() => {
    if (selectedFile && isLocked && lockedBy === 'You' && hasChanges && content && currentBranch) {
      const timeoutId = setTimeout(() => {
        console.log('Auto-saving live content for file:', selectedFile, 'on branch:', currentBranch);
        saveLiveContent(selectedFile, content);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedFile, isLocked, lockedBy, hasChanges, content, currentBranch, saveLiveContent]);

  // Clear state when branch changes
  useEffect(() => {
    console.log('Branch changed to:', currentBranch, '- clearing editor state');
    setSelectedFile(undefined);
    setContent("");
    setHasChanges(false);
    setModifiedFiles(new Set());
  }, [currentBranch]);

  const handleFileSelect = async (filePath: string) => {
    console.log('=== FILE SELECTION DEBUG ===');
    console.log('Selected file path:', filePath);
    console.log('Current branch:', currentBranch);
    
    // Release lock on previous file if user owns it
    if (selectedFile && isLocked && lockedBy === 'You') {
      console.log('Releasing lock on previous file:', selectedFile);
      await releaseLock(selectedFile);
    }
    
    setSelectedFile(filePath);
    setHasChanges(false);
    setLoadingContent(true);
    
    try {
      // Check if there's live content for this file on the current branch first
      const liveFileContent = await loadLiveContent(filePath);
      
      if (liveFileContent) {
        console.log('Found live content for:', filePath, 'on branch:', currentBranch);
        setContent(liveFileContent);
        setLoadingContent(false);
        // Try to acquire lock automatically for editing
        setTimeout(() => acquireLock(filePath), 100);
        return;
      }

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
      
      // Try to acquire lock automatically for editing after content is loaded
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
      
      // Try to acquire lock automatically for editing even on error
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
      if (selectedFile) {
        setModifiedFiles(prev => new Set(prev).add(selectedFile));
      }
    }
  };

  const handleAcquireLock = async () => {
    if (selectedFile && currentBranch) {
      console.log('Manually acquiring lock for:', selectedFile, 'on branch:', currentBranch);
      const success = await acquireLock(selectedFile);
      if (success) {
        console.log('Lock acquired for editing:', selectedFile, 'on branch:', currentBranch);
      }
    }
  };

  const getGitHubAppToken = async () => {
    try {
      // Get the GitHub installation ID from the database
      const { data: installations, error } = await supabase
        .from('github_installations')
        .select('installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching GitHub installation:', error);
        throw new Error('Failed to get GitHub installation');
      }

      if (!installations) {
        throw new Error('No GitHub app installation found. Please configure GitHub app first.');
      }

      // Get installation token from the edge function
      const { data, error: tokenError } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId: installations.installation_id }
      });

      if (tokenError) {
        console.error('Error getting GitHub app token:', tokenError);
        throw new Error('Failed to get GitHub app token');
      }

      return data.token;
    } catch (error) {
      console.error('Error in getGitHubAppToken:', error);
      throw error;
    }
  };

  // Helper function to convert editor file path to original content path
  const getOriginalFilePath = (editorFilePath: string): string => {
    // Remove leading slashes
    let cleanPath = editorFilePath.replace(/^\/+/, '');
    
    // Ensure it has .md extension
    if (!cleanPath.endsWith('.md')) {
      cleanPath = `${cleanPath}.md`;
    }
    
    // The original file structure should be preserved as public/content/{path}
    // But for GitHub, we want just the content/{path} structure
    return `public/content/${cleanPath}`;
  };

  const collectAllLiveContent = async () => {
    const allContent: { path: string; content: string }[] = [];
    
    // Get all live editing sessions for current branch
    console.log('Collecting live content from', sessions.length, 'sessions for branch:', currentBranch);
    
    for (const session of sessions) {
      if (session.content && session.content.trim()) {
        allContent.push({
          path: getOriginalFilePath(session.file_path),
          content: session.content
        });
        console.log('Added session content for:', session.file_path);
      }
    }
    
    // Add current file if it has changes
    if (selectedFile && hasChanges && content) {
      const originalPath = getOriginalFilePath(selectedFile);
      const existingIndex = allContent.findIndex(item => item.path === originalPath);
      if (existingIndex >= 0) {
        allContent[existingIndex].content = content;
        console.log('Updated current file content for:', selectedFile);
      } else {
        allContent.push({
          path: originalPath,
          content: content
        });
        console.log('Added current file content for:', selectedFile);
      }
    }
    
    console.log('Total live content collected:', allContent.length, 'files from branch:', currentBranch);
    return allContent;
  };

  const handleCreatePR = async () => {
    // Use currentBranch as the SOURCE branch (where changes come from)
    const sourceBranch = currentBranch || 'main';
    console.log('Creating PR FROM branch:', sourceBranch, 'TO main');
    
    if (!sourceBranch) {
      toast.error('No current branch selected');
      return;
    }

    setCreatingPR(true);
    
    try {
      // Get GitHub app token instead of OAuth token
      const token = await getGitHubAppToken();
      
      // Get repository configuration
      const repoConfig = await githubService.getRepoConfig();
      if (!repoConfig) {
        toast.error('No GitHub repository configured. Please configure a repository first.');
        return;
      }

      // Collect all live content for the PR
      const allLiveContent = await collectAllLiveContent();
      
      if (allLiveContent.length === 0) {
        toast.error('No changes to create a pull request for');
        return;
      }

      console.log('Files to include in PR:', allLiveContent.map(item => item.path));

      // Create a temporary branch name for the PR
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const prBranchName = `editor-changes-${timestamp}`;

      // Create PR FROM sourceBranch TO main
      const result = await githubService.createPullRequest(
        {
          title: `Update documentation from ${sourceBranch} - ${allLiveContent.length} file${allLiveContent.length !== 1 ? 's' : ''} modified`,
          body: `Updated documentation files from branch "${sourceBranch}" to main:\n${allLiveContent.map(item => `- ${item.path}`).join('\n')}\n\nThis pull request was created from the collaborative editor.`,
          files: allLiveContent.map(item => ({
            path: item.path,
            content: item.content
          })),
          baseBranch: 'main', // TARGET branch (where changes should be merged TO)
          headBranch: prBranchName // SOURCE branch (where changes come FROM)
        },
        token,
        repoConfig
      );

      if (result.success) {
        toast.success(`Pull request created successfully from "${sourceBranch}" to main!`, {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
        
        // Clear all live editing sessions for current branch after successful PR
        try {
          console.log('Clearing live editing sessions for branch:', sourceBranch);
          const { error } = await supabase
            .from('live_editing_sessions')
            .delete()
            .eq('branch_name', sourceBranch)
            .in('file_path', sessions.map(s => s.file_path));
          
          if (!error) {
            setHasChanges(false);
            setModifiedFiles(new Set());
            toast.success('Live editing sessions cleared');
          } else {
            console.error('Error clearing live sessions:', error);
          }
        } catch (error) {
          console.error('Error clearing live sessions:', error);
        }
      } else {
        toast.error(result.error || 'Failed to create pull request');
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

  const handleBulkDelete = (filesToDelete: string[]) => {
    const fileSet = new Set(filesToDelete);
    setSelectedForBulkDelete(fileSet);
    setShowBulkDeleteDialog(true);
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

  // Calculate if PR button should be disabled
  const totalLiveFiles = sessions.filter(s => s.content && s.content.trim()).length;
  const hasAnyChanges = hasChanges || totalLiveFiles > 0;
  const isPRButtonDisabled = !hasAnyChanges || creatingPR;

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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h1 className="text-lg font-medium text-muted-foreground">
                  {activeTab === 'content' ? 'Content Editor' : activeTab === 'seo' ? 'SEO Editor' : 'Navigation Editor'}
                </h1>
              </div>
              {/* Add Branch Selector */}
              <BranchSelector />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50 transition-colors relative">
                <Home className="h-4 w-4" />
                Home
                {/* Orange dot for uncommitted changes */}
                {hasAnyChanges && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background"></div>
                )}
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
          {/* Enhanced Tab Navigation with Live Editing Info and Create PR Button */}
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
                    {/* Show manual editing button only if file is selected but locked by someone else */}
                    {selectedFile && isLocked && lockedBy !== 'You' && !isAcquiringLock && (
                      <Button
                        onClick={handleAcquireLock}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Take Control
                      </Button>
                    )}

                    {totalLiveFiles > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        {totalLiveFiles} file{totalLiveFiles !== 1 ? 's' : ''} with live changes on {currentBranch || 'main'}
                      </div>
                    )}
                    
                    <Button
                      onClick={handleCreatePR}
                      variant="outline"
                      size="sm"
                      disabled={isPRButtonDisabled}
                      className="flex items-center gap-2"
                      title={
                        !hasAnyChanges 
                          ? "No changes to create PR for" 
                          : creatingPR 
                            ? "Creating PR..." 
                            : `Create pull request from ${currentBranch || 'main'} to main with all live changes`
                      }
                    >
                      {creatingPR ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <GitPullRequest className="w-4 h-4" />
                      )}
                      PR: {currentBranch || 'main'} → main {totalLiveFiles > 0 && `(${totalLiveFiles})`}
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
                  pendingChanges={modifiedFilesArray}
                  liveSessions={sessions}
                />
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
