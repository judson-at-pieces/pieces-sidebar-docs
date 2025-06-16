
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processCustomSyntax } from './customSyntaxProcessor';
import { createDynamicComponentMap } from './DynamicComponentMap';

interface MarkdownRendererProps {
  content: string;
}

const HashnodeMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  console.log('🚀 HashnodeMarkdownRenderer processing content length:', content.length);
  
  // Process custom syntax first
  const processedContent = processCustomSyntax(content);
  console.log('🔄 Processed content sample:', processedContent.substring(0, 200));
  
  // Create dynamic component map
  const components = createDynamicComponentMap();
  console.log('🔧 Created component map with components:', Object.keys(components));

  return (
    <div className="hn-markdown-renderer">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
        // Allow HTML to enable iframe embeds
        rehypePlugins={[]}
        // This allows HTML elements like iframe for YouTube embeds
        skipHtml={false}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default HashnodeMarkdownRenderer;
