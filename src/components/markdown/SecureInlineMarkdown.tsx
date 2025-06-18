
import React from 'react';
import { processInlineMarkdown, ProcessedMarkdown } from '@/utils/secureMarkdownProcessor';

interface SecureInlineMarkdownProps {
  content: string;
}

export const SecureInlineMarkdown: React.FC<SecureInlineMarkdownProps> = ({ content }) => {
  console.log('🔒 SecureInlineMarkdown processing:', content.substring(0, 100));
  
  if (!content || typeof content !== 'string') {
    return null;
  }
  
  const elements = processInlineMarkdown(content);
  console.log('🔒 SecureInlineMarkdown processed elements:', elements.length);
  
  return (
    <>
      {elements.map((element, index) => {
        switch (element.type) {
          case 'bold':
            return <strong key={index} className="font-semibold">{element.content}</strong>;
          case 'italic':
            return <em key={index} className="italic">{element.content}</em>;
          case 'code':
            return (
              <code key={index} className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                {element.content}
              </code>
            );
          case 'link':
            if (!element.href || !element.content) {
              return <span key={index}>{element.content || ''}</span>;
            }
            const href = element.href;
            const target = element.target || (href.startsWith('http') ? '_blank' : undefined);
            const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
            return (
              <a 
                key={index} 
                href={href}
                target={target}
                rel={rel}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-4"
              >
                {element.content}
              </a>
            );
          case 'image':
            if (!element.src) {
              return <span key={index}>{element.content}</span>;
            }
            
            const alignClass = {
              'left': 'text-left',
              'center': 'text-center',
              'right': 'text-right'
            }[element.align || 'center'] || 'text-center';
            
            const widthClass = element.fullwidth ? 'w-full' : 'max-w-full';
            
            return (
              <div key={index} className={`my-4 ${alignClass}`}>
                <img 
                  src={element.src}
                  alt={element.alt || ''}
                  className={`${widthClass} h-auto rounded-lg cursor-pointer transition-transform duration-200 hover:-translate-y-1`}
                />
              </div>
            );
          case 'text':
          default:
            return <span key={index}>{element.content}</span>;
        }
      })}
    </>
  );
};
