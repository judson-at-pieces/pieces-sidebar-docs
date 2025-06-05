
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';
import { Edit, Eye, Sparkles, Wand2, GitPullRequest } from 'lucide-react';
import { toast } from 'sonner';
import { githubService } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TSXRendererProps {
  content: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
  filePath?: string;
}

export function TSXRenderer({ content, onContentChange, readOnly = false, filePath }: TSXRendererProps) {
  const [mode, setMode] = useState<'preview' | 'wysiwyg'>('preview');
  const { user } = useAuth();

  // Process the content to match the compiled content format
  const processedContent = React.useMemo(() => {
    // If content doesn't start with frontmatter, add a basic one
    if (!content.startsWith('---')) {
      return `---
title: "Preview"
---
***
${content}`;
    }
    
    // If content has frontmatter but no section delimiter, add it
    if (!content.includes('***')) {
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd !== -1) {
        const frontmatter = content.substring(0, frontmatterEnd + 3);
        const markdownContent = content.substring(frontmatterEnd + 3).trim();
        return `${frontmatter}
***
${markdownContent}`;
      }
    }
    
    return content;
  }, [content]);

  async function handleCreatePR() {
    try {
      toast.info('Creating pull request...', { duration: 2000 });
      
      // Get GitHub token from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        toast.error('GitHub authentication required. Please reconnect to GitHub in Admin settings.', { duration: 5000 });
        return;
      }

      // Get GitHub configuration
      const config = await githubService.getRepoConfig();
      if (!config) {
        toast.error('GitHub repository not configured. Please configure it in Admin settings.', { duration: 5000 });
        return;
      }

      const { owner, repo } = config;

      if (!filePath) {
        toast.error('No file selected for editing. Please select a file first.', { duration: 3000 });
        return;
      }

      // Extract title from frontmatter or use filename
      let title = 'Update documentation content';
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const titleMatch = frontmatterMatch[1].match(/title:\s*["']?([^"'\n]+)["']?/);
        if (titleMatch) {
          title = `Update: ${titleMatch[1]}`;
        }
      } else {
        // Use filename as fallback
        const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') || 'content';
        title = `Update: ${fileName.replace(/-/g, ' ')}`;
      }

      // Get user information for PR attribution
      const userEmail = user?.email || 'unknown@pieces.app';
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];

      // Determine the correct file path in the repository
      let repoFilePath = filePath;
      
      // If it's a content file, place it in public/content
      if (!filePath.startsWith('public/') && !filePath.startsWith('src/')) {
        repoFilePath = `public/content/${filePath}`;
      }
      
      // Ensure .md extension
      if (!repoFilePath.endsWith('.md')) {
        repoFilePath = `${repoFilePath}.md`;
      }

      // Create the pull request using our GitHub service
      const result = await githubService.createPullRequest(
        {
          title,
          body: `This pull request updates documentation content via the Pieces documentation editor.

## Changes
- Updated content for: \`${repoFilePath}\`
- Content reviewed and ready for publication

## Authored By
- **Editor:** ${userName} (${userEmail})
- **Date:** ${new Date().toISOString().split('T')[0]}

## Review Notes
Please review the changes and merge when ready.

---
*This PR was created automatically by the Pieces Documentation Editor*`,
          files: [
            {
              path: repoFilePath,
              content: content
            }
          ]
        },
        session.provider_token,
        config
      );

      if (result.success && result.prNumber && result.prUrl) {
        toast.success(`Pull request created successfully! #${result.prNumber}`, { 
          duration: 5000,
          action: {
            label: 'View PR',
            onClick: () => window.open(result.prUrl, '_blank')
          }
        });
      } else {
        throw new Error(result.error || 'Failed to create PR');
      }
      
      console.log('PR created with content changes for file:', repoFilePath);
    } catch (error) {
      toast.error('Failed to create pull request. Please check your GitHub connection.', { duration: 3000 });
      console.error('PR creation failed:', error);
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/10">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <span className="text-sm font-medium">Live Preview</span>
              <div className="text-xs text-muted-foreground">
                {mode === 'wysiwyg' 
                  ? "✨ Click elements to edit them directly" 
                  : "📝 Real-time Hashnode markdown rendering"
                }
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && onContentChange && (
            <>
              <Button
                variant={mode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('preview')}
                className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                variant={mode === 'wysiwyg' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('wysiwyg')}
                className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-200 dark:border-purple-800"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Edit Mode
              </Button>
            </>
          )}
          
          {/* Create PR Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreatePR}
            disabled={!filePath}
            className="h-8 px-3 gap-2 text-xs font-medium transition-all duration-200 bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20 border-blue-200 dark:border-blue-800"
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            Create PR
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'wysiwyg' && !readOnly && onContentChange ? (
          <div className="h-full animate-in fade-in slide-in-from-top-2 duration-300">
            <WYSIWYGEditor 
              content={content} 
              onContentChange={onContentChange}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto animate-in fade-in duration-300">
            <div className="h-full p-6 bg-muted/10 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                  <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
                    <span className="font-medium">Live Preview</span>
                    <p className="text-xs mt-1">This shows exactly how the content will appear using Hashnode renderer.</p>
                  </div>
                  <div className="markdown-content">
                    <HashnodeMarkdownRenderer content={processedContent} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
