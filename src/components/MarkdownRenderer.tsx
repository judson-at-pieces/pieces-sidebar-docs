
import React from 'react';
import HashnodeMarkdownRenderer from './HashnodeMarkdownRenderer';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return <HashnodeMarkdownRenderer content={content} />;
};

export default MarkdownRenderer;
