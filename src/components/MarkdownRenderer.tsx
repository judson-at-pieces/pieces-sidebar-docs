
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processCustomSyntax } from './markdown/customSyntaxProcessor';
import { createComponentMappings } from './markdown/componentMappings';

interface MarkdownRendererProps {
  content: string;
  components?: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, components: customComponents }) => {
  const processedContent = processCustomSyntax(content);
  const defaultComponents = createComponentMappings();
  
  // Merge custom components with default ones
  const components = {
    ...defaultComponents,
    ...customComponents
  };
  
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      components={components}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

// Export both default and named export for compatibility
export default MarkdownRenderer;
export { MarkdownRenderer };
