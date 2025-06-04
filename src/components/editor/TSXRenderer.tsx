
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';
import { Edit, Eye, Sparkles, Wand2 } from 'lucide-react';

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
        
        {!readOnly && onContentChange && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
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
            <div className="min-h-full py-8 px-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg shadow-black/5 p-8 min-h-[400px]">
                  <div className="markdown-content prose prose-neutral dark:prose-invert max-w-none">
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
