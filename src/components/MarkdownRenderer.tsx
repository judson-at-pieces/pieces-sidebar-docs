
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processCustomSyntax } from './markdown/customSyntaxProcessor';
import { createComponentMappings } from './markdown/componentMappings';

interface MarkdownRendererProps {
  content: string;
  components?: Record<string, React.ComponentType<any>>;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, components }) => {
  const processedContent = processCustomSyntax(content);
  const componentMappings = components || createComponentMappings();
  
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      components={componentMappings}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

// Export both default and named export for compatibility
export default MarkdownRenderer;
export { MarkdownRenderer };
