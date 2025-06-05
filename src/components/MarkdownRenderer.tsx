
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processCustomSyntax } from './markdown/customSyntaxProcessor';
import { createComponentMappings } from './markdown/componentMappings';

interface MarkdownRendererProps {
  content: string;
  components?: Record<string, React.ComponentType<any>>;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, components: externalComponents }) => {
  const processedContent = processCustomSyntax(content);
  const defaultComponents = createComponentMappings();
  
  // Merge external components with default ones, external takes precedence
  const components = externalComponents ? { ...defaultComponents, ...externalComponents } : defaultComponents;
  
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
