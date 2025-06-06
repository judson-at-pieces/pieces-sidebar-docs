
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Edit, AlertCircle, SplitSquareHorizontal, MousePointer, GitPullRequest } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import { githubService } from '@/services/githubService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EnhancedEditorProps {
  selectedFile?: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  hasChanges: boolean;
  saving: boolean;
}

type ViewMode = 'edit' | 'preview' | 'split' | 'wysiwyg';

export function EnhancedEditor({ 
  selectedFile, 
  content, 
  onContentChange, 
  onSave, 
  hasChanges, 
  saving 
}: EnhancedEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [textareaContent, setTextareaContent] = useState(content);
  const [creatingPR, setCreatingPR] = useState(false);
  const { session, user } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('EnhancedEditor Debug:', {
      hasChanges,
      creatingPR,
      hasSession: !!session,
      hasUser: !!user,
      hasProviderToken: !!session?.provider_token,
      sessionKeys: session ? Object.keys(session) : [],
      userEmail: user?.email
    });
  }, [hasChanges, creatingPR, session, user]);

  // Update textarea when content prop changes
  useEffect(() => {
    setTextareaContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setTextareaContent(newContent);
    onContentChange(newContent);
  };

  const handleSave = () => {
    onSave();
  };

  const handleCreatePR = async () => {
    if (!selectedFile || !hasChanges) {
      toast.error('No changes to create a pull request for');
      return;
    }

    if (!session?.provider_token) {
      toast.error('GitHub authentication required. Please sign in with GitHub.');
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
              content: textareaContent
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
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setCreatingPR(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No file selected</h3>
          <p className="text-sm text-muted-foreground">Choose a file from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  // Calculate if PR button should be disabled
  const isPRButtonDisabled = !hasChanges || creatingPR || !session?.provider_token;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold truncate max-w-md">{selectedFile}</h2>
            {hasChanges && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex items-center border rounded-md p-1">
              <Button
                variant={viewMode === 'edit' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              
              <Button
                variant={viewMode === 'wysiwyg' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('wysiwyg')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <MousePointer className="w-4 h-4" />
                WYSIWYG
              </Button>
              
              <Button
                variant={viewMode === 'split' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('split')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <SplitSquareHorizontal className="w-4 h-4" />
                Split
              </Button>
              
              <Button
                variant={viewMode === 'preview' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="flex items-center gap-2 px-3 py-1"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
            
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
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full p-4">
            <Textarea
              value={textareaContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start writing your content..."
              className="h-full min-h-full resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed"
              style={{ 
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
                lineHeight: '1.6'
              }}
            />
          </div>
        )}

        {viewMode === 'wysiwyg' && (
          <WYSIWYGEditor
            content={textareaContent}
            onContentChange={handleContentChange}
          />
        )}

        {viewMode === 'preview' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <HashnodeMarkdownRenderer content={textareaContent} />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-full flex">
            {/* Editor Pane */}
            <div className="flex-1 border-r">
              <div className="h-full p-4">
                <Textarea
                  value={textareaContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Start writing your content..."
                  className="h-full min-h-full resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-relaxed"
                  style={{ 
                    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </div>
            
            {/* Preview Pane */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-none mx-auto p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <HashnodeMarkdownRenderer content={textareaContent} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
