
import React from 'react';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  // For markdown content, just display it as plain text for now
  // This will show the raw markdown which is much more useful for editing
  const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
  
  return (
    <div className="h-full p-6 bg-muted/10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
          <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
            <span className="font-medium">Raw Markdown Preview</span>
            <p className="text-xs mt-1">This shows the raw markdown content. When saved and merged, it will be compiled to the final format.</p>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground overflow-auto max-h-[70vh]">
            {cleanContent || content}
          </pre>
        </div>
      </div>
    </div>
  );
}
