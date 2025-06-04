
import React from 'react';
import HashnodeMarkdownRenderer from './HashnodeMarkdownRenderer';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return <HashnodeMarkdownRenderer content={content} />;
};

// Export both default and named export for compatibility
export default MarkdownRenderer;
export { MarkdownRenderer };
