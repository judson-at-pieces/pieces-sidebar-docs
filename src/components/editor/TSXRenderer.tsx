
import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  // Clean the content by removing frontmatter
  const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
  
  return (
    <div className="h-full p-6 bg-muted/10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
          <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
            <span className="font-medium">Markdown Preview</span>
            <p className="text-xs mt-1">This shows how the markdown will be rendered on the docs site.</p>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <MarkdownRenderer content={cleanContent || content} />
          </div>
        </div>
      </div>
    </div>
  );
}
