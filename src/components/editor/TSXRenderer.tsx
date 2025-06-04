
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';
import { Edit, Eye, Sparkles, Wand2, GitPullRequest } from 'lucide-react';
import { toast } from 'sonner';

interface TSXRendererProps {
  content: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

export function TSXRenderer({ content, onContentChange, readOnly = false }: TSXRendererProps) {
  const [mode, setMode] = useState<'preview' | 'wysiwyg'>('preview');
  
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

  const handleCreatePR = async () => {
    try {
      toast.info('Creating pull request...', { duration: 2000 });
      
      // GitHub API call to create PR
      const response = await fetch('/api/create-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Update documentation content',
          content: content,
          branch: `docs-update-${Date.now()}`,
          message: 'Update documentation via editor'
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Pull request created successfully! #${result.number}`, { 
          duration: 5000,
          action: {
            label: 'View PR',
            onClick: () => window.open(result.html_url, '_blank')
          }
        });
      } else {
        throw new Error('Failed to create PR');
      }
      
      console.log('PR created with content changes');
    } catch (error) {
      toast.error('Failed to create pull request. Please check your GitHub connection.', { duration: 3000 });
      console.error('PR creation failed:', error);
    }
  };

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
                  : "👀 Real-time preview of your content"
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
            <div className="min-h-full">
              {/* Use the exact same container structure as docs pages */}
              <div className="container mx-auto px-4 py-8 max-w-4xl">
                <article className="prose prose-neutral dark:prose-invert max-w-none">
                  <HashnodeMarkdownRenderer content={processedContent} />
                </article>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
