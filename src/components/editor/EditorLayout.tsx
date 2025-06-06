
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EditorSidebar } from './EditorSidebar';
import { EditorMain } from './EditorMain';
import { NavigationStructurePanel } from './NavigationStructurePanel';
import { ContentSyncPanel } from '@/components/admin/ContentSyncPanel';
import { Button } from '@/components/ui/button';
import { GitPullRequest, Save, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { toast } from 'sonner';
import { useFileStructure } from '@/hooks/useFileStructure';
import { githubService } from '@/services/githubService';

export function EditorLayout() {
  const { user, hasRole, session } = useAuth();
  const { fileStructure } = useFileStructure();
  
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Debug GitHub auth state
  useEffect(() => {
    console.log('EditorLayout Debug:', {
      hasSession: !!session,
      hasProviderToken: !!session?.provider_token,
      sessionKeys: session ? Object.keys(session) : [],
      userEmail: user?.email
    });
  }, [session, user]);

  const handleFileSelect = useCallback(async (filePath: string) => {
    if (hasChanges) {
      const shouldProceed = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!shouldProceed) return;
    }

    console.log('=== FILE SELECTION DEBUG ===');
    console.log('Selected file path:', filePath);
    
    setSelectedFile(filePath);
    
    try {
      // Try to fetch from public/content first
      const contentUrl = `/content/${filePath}`;
      console.log('Fetching from URL:', contentUrl);
      
      const response = await fetch(contentUrl);
      
      if (response.ok) {
        const content = await response.text();
        setFileContent(content || '');
        setHasChanges(false);
        console.log('✅ File loaded successfully, content length:', content.length);
      } else {
        console.log('❌ Failed to fetch from public/content, status:', response.status);
        setFileContent('');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Failed to load file content');
      setFileContent('');
      setHasChanges(false);
    }
  }, [hasChanges]);

  const handleContentChange = (content: string) => {
    setFileContent(content);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) return;
    
    setSaving(true);
    try {
      // Simulate save - in a real app this would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      toast.success('File saved successfully');
    } catch (error) {
      toast.error('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePR = async () => {
    if (!selectedFile || !hasChanges) {
      toast.error('No changes to create a pull request for');
      return;
    }

    // Check if user is authenticated with GitHub
    if (!session?.provider_token) {
      toast.error('Please sign in with GitHub to create pull requests');
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

      // Create PR with the current file changes
      const fileName = selectedFile.split('/').pop() || selectedFile;
      const result = await githubService.createPullRequest(
        {
          title: `Update ${fileName}`,
          body: `Updated content for ${selectedFile}\n\nThis pull request was created from the editor.`,
          files: [
            {
              path: selectedFile.endsWith('.md') ? selectedFile : `${selectedFile}.md`,
              content: fileContent
            }
          ]
        },
        session.provider_token,
        repoConfig
      );

      if (result.success) {
        toast.success('Pull request created successfully!', {
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
        setHasChanges(false); // Mark as saved since it's now in a PR
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setCreatingPR(false);
    }
  };

  // Calculate if PR button should be disabled
  const isPRButtonDisabled = !hasChanges || creatingPR || !session?.provider_token;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Content Editor</h1>
            {selectedFile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedFile}</span>
                {hasChanges && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            
            <Button
              onClick={handleCreatePR}
              variant="outline"
              size="sm"
              disabled={isPRButtonDisabled}
              className="flex items-center gap-2"
              title={
                !hasChanges 
                  ? "No changes to create PR for" 
                  : !session?.provider_token 
                    ? "Sign in with GitHub to create PR" 
                    : creatingPR 
                      ? "Creating PR..." 
                      : "Create pull request"
              }
            >
              {creatingPR ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitPullRequest className="w-4 h-4" />
              )}
              Create PR
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              size="sm"
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <Tabs defaultValue="files" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 shrink-0 m-2">
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="navigation">Navigation</TabsTrigger>
                {hasRole('admin') && <TabsTrigger value="sync">Sync</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="files" className="flex-1 overflow-hidden mt-0">
                <EditorSidebar 
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  fileStructure={fileStructure}
                />
              </TabsContent>
              
              <TabsContent value="navigation" className="flex-1 overflow-hidden mt-0">
                <NavigationStructurePanel />
              </TabsContent>
              
              {hasRole('admin') && (
                <TabsContent value="sync" className="flex-1 overflow-hidden mt-0">
                  <ContentSyncPanel />
                </TabsContent>
              )}
            </Tabs>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Editor */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <EditorMain
              selectedFile={selectedFile}
              content={fileContent}
              onContentChange={handleContentChange}
              onSave={handleSave}
              hasChanges={hasChanges}
              saving={saving}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
