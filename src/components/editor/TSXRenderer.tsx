
import React from 'react';
import HashnodeMarkdownRenderer from '@/components/markdown/HashnodeMarkdownRenderer';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
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
    <div className="h-full p-6 bg-muted/10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
          <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
            <span className="font-medium">Live Preview</span>
            <p className="text-xs mt-1">This shows exactly how the content will appear on the docs site.</p>
          </div>
          <div className="markdown-content">
            <HashnodeMarkdownRenderer content={processedContent} />
          </div>
        </div>
      </div>
    </div>
  );
}
