
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
        // Handle both target="_blank" and external links
        const isExternal = element.href?.startsWith('http') || element.target === '_blank';
        const targetAttr = element.target || (isExternal ? '_blank' : undefined);
        const relAttr = isExternal ? 'noopener noreferrer' : undefined;
        
        return (
          <a 
            key={index} 
            href={element.href} 
            className="hn-link text-primary hover:underline"
            target={targetAttr}
            rel={relAttr}
          >
            {element.content}
          </a>
        );
      
      case 'image':
        const alignmentClass = {
          left: 'text-left',
          center: 'text-center',
          right: 'text-right'
        }[element.align || 'center'] || 'text-center';
        
        const widthClass = element.fullwidth ? 'w-full' : 'max-w-full';
        
        return (
          <div key={index} className={`my-6 ${alignmentClass}`}>
            <img 
              src={element.src} 
              alt={element.alt || ''} 
              className={`rounded-lg ${widthClass} h-auto`}
              loading="lazy"
              decoding="async"
            />
          </div>
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
