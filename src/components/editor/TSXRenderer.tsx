
import React from 'react';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  // Remove frontmatter for preview
  const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
  
  return (
    <div className="h-full p-6 bg-muted/10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground overflow-auto">
            {cleanContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
