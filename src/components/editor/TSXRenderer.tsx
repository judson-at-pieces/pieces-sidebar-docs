
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import HashnodeMarkdownRenderer from '@/components/HashnodeMarkdownRenderer';
import { Edit, Eye } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-muted/10">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Live Preview</span>
          <p className="text-xs text-muted-foreground">
            {mode === 'wysiwyg' 
              ? "Click elements to edit them directly" 
              : "This shows exactly how the content will appear on the docs site."
            }
          </p>
        </div>
        
        {!readOnly && onContentChange && (
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              variant={mode === 'wysiwyg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('wysiwyg')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'wysiwyg' && !readOnly && onContentChange ? (
          <WYSIWYGEditor 
            content={content} 
            onContentChange={onContentChange}
          />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                <div className="markdown-content">
                  <HashnodeMarkdownRenderer content={processedContent} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
