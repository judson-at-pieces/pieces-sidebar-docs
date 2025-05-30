
import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  const renderContent = () => {
    try {
      // Remove frontmatter if present for preview
      const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
      
      // Use the existing MarkdownRenderer which handles our custom syntax
      return <MarkdownRenderer content={cleanContent} />;
    } catch (error) {
      console.error('Error rendering markdown content:', error);
      return (
        <div className="text-red-500 p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h3 className="font-bold mb-2">Preview Error</h3>
          <p className="text-sm">There was an error rendering the markdown preview. Please check your syntax.</p>
          <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto max-h-32">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="markdown-preview prose prose-gray dark:prose-invert max-w-none">
      {renderContent()}
    </div>
  );
}
