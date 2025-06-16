
import React from 'react';
import { processInlineMarkdown, ProcessedMarkdown } from '@/utils/secureMarkdownProcessor';

interface SecureInlineMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Secure inline markdown renderer that doesn't use dangerouslySetInnerHTML
 */
export function SecureInlineMarkdown({ content, className }: SecureInlineMarkdownProps) {
  const elements = processInlineMarkdown(content);

  const renderElement = (element: ProcessedMarkdown, index: number): React.ReactNode => {
    switch (element.type) {
      case 'bold':
        return <strong key={index}>{element.content}</strong>;
      
      case 'italic':
        return <em key={index}>{element.content}</em>;
      
      case 'code':
        return (
          <code key={index} className="hn-inline-code bg-muted px-1 py-0.5 rounded text-sm font-mono">
            {element.content}
          </code>
        );
      
      case 'link':
        return (
          <a 
            key={index} 
            href={element.href} 
            className="hn-link text-primary hover:underline"
            target={element.href?.startsWith('http') ? '_blank' : undefined}
            rel={element.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {element.content}
          </a>
        );
      
      case 'text':
      default:
        return <span key={index}>{element.content}</span>;
    }
  };

  return (
    <span className={className}>
      {elements.map(renderElement)}
    </span>
  );
}
