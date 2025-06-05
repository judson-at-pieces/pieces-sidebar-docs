
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import ReactMarkdown from 'react-markdown';
import { createComponentMappings } from '@/components/markdown/componentMappings';
import { processCustomSyntax } from '@/components/markdown/customSyntaxProcessor';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeRaw from 'rehype-raw';
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
  const components = createComponentMappings();

  // Process the content using the EXACT same method as the actual user-facing docs
  const processedContent = React.useMemo(() => {
    console.log('🔧 TSXRenderer processing content with EXACT docs process...');
    
    // Apply custom syntax processing (same as MarkdownRenderer)
    const processedMarkdown = processCustomSyntax(content);
    
    console.log('🔧 TSXRenderer content processed:', {
      originalLength: content.length,
      processedLength: processedMarkdown.length,
      hasCustomSyntax: processedMarkdown !== content
    });

    return processedMarkdown;
  }, [content]);

  async function handleCreatePR() {
    try {
      toast.info('Creating pull request...', { duration: 2000 });
      
      // Get GitHub configuration first
      const config = await githubService.getRepoConfig();
      if (!config) {
        toast.error('GitHub repository not configured. Please configure it in Admin settings.', { duration: 5000 });
        return;
      }

      // Check if we have the file path
      if (!filePath) {
        toast.error('No file selected for editing. Please select a file first.', { duration: 3000 });
        return;
      }

      // Get the installation ID from the config
      const { data: configData, error: configError } = await supabase
        .from('github_config')
        .select('installation_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configError || !configData?.installation_id) {
        toast.error('GitHub App not properly configured. Please check Admin settings.', { duration: 5000 });
        return;
      }

      console.log('Getting GitHub App token for installation:', configData.installation_id);

      // Get GitHub App installation token using your existing edge function
      const { data: authResponse, error: authError } = await supabase.functions.invoke('github-app-auth', {
        body: { installationId: configData.installation_id }
      });

      if (authError || !authResponse?.token) {
        console.error('GitHub App auth error:', authError);
        toast.error('Failed to authenticate with GitHub App. Please check the configuration.', { duration: 5000 });
        return;
      }

      const githubToken = authResponse.token;
      const { owner, repo } = config;

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

      console.log('Creating PR with GitHub App token for:', { 
        title, 
        repoFilePath, 
        owner, 
        repo,
        installationId: configData.installation_id
      });

      // Create the pull request using the GitHub App token
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
        githubToken,
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
      
      console.log('PR created successfully for file:', repoFilePath);
    } catch (error: any) {
      console.error('PR creation failed:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('401') || error.message?.includes('Authentication failed')) {
        toast.error('GitHub App authentication failed. Please check the GitHub App configuration in Admin settings.', { 
          duration: 5000,
          action: {
            label: 'Go to Admin',
            onClick: () => window.location.href = '/admin'
          }
        });
      } else if (error.message?.includes('403') || error.message?.includes('Access forbidden')) {
        toast.error('Access forbidden. Please ensure the GitHub App is installed on the repository with proper permissions.', { duration: 5000 });
      } else if (error.message?.includes('404')) {
        toast.error('Repository not found. Please check the repository configuration in Admin settings.', { duration: 5000 });
      } else {
        toast.error(`Failed to create pull request: ${error.message || 'Unknown error'}`, { duration: 5000 });
      }
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
                  : "📝 Real-time markdown rendering with exact docs processing"
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
                    <p className="text-xs mt-1">This shows exactly how the content will appear using the same processing and components as the actual docs.</p>
                  </div>
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={components}
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      skipHtml={false}
                    >
                      {processedContent}
                    </ReactMarkdown>
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

async function handleCreatePR() {
  try {
    toast.info('Creating pull request...', { duration: 2000 });
    
    // Get GitHub configuration first
    const config = await githubService.getRepoConfig();
    if (!config) {
      toast.error('GitHub repository not configured. Please configure it in Admin settings.', { duration: 5000 });
      return;
    }

    // Check if we have the file path
    if (!filePath) {
      toast.error('No file selected for editing. Please select a file first.', { duration: 3000 });
      return;
    }

    // Get the installation ID from the config
    const { data: configData, error: configError } = await supabase
      .from('github_config')
      .select('installation_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !configData?.installation_id) {
      toast.error('GitHub App not properly configured. Please check Admin settings.', { duration: 5000 });
      return;
    }

    console.log('Getting GitHub App token for installation:', configData.installation_id);

    // Get GitHub App installation token using your existing edge function
    const { data: authResponse, error: authError } = await supabase.functions.invoke('github-app-auth', {
      body: { installationId: configData.installation_id }
    });

    if (authError || !authResponse?.token) {
      console.error('GitHub App auth error:', authError);
      toast.error('Failed to authenticate with GitHub App. Please check the configuration.', { duration: 5000 });
      return;
    }

    const githubToken = authResponse.token;
    const { owner, repo } = config;

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

    console.log('Creating PR with GitHub App token for:', { 
      title, 
      repoFilePath, 
      owner, 
      repo,
      installationId: configData.installation_id
    });

    // Create the pull request using the GitHub App token
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
      githubToken,
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
    
    console.log('PR created successfully for file:', repoFilePath);
  } catch (error: any) {
    console.error('PR creation failed:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('401') || error.message?.includes('Authentication failed')) {
      toast.error('GitHub App authentication failed. Please check the GitHub App configuration in Admin settings.', { 
        duration: 5000,
        action: {
          label: 'Go to Admin',
          onClick: () => window.location.href = '/admin'
        }
      });
    } else if (error.message?.includes('403') || error.message?.includes('Access forbidden')) {
      toast.error('Access forbidden. Please ensure the GitHub App is installed on the repository with proper permissions.', { duration: 5000 });
    } else if (error.message?.includes('404')) {
      toast.error('Repository not found. Please check the repository configuration in Admin settings.', { duration: 5000 });
    } else {
      toast.error(`Failed to create pull request: ${error.message || 'Unknown error'}`, { duration: 5000 });
    }
  }
}
