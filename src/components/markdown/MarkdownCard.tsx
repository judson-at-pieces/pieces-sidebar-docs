
import React from 'react';
import { SecureInlineMarkdown } from './SecureInlineMarkdown';

interface MarkdownCardProps {
  title: string;
  image?: string;
  href?: string;
  children?: React.ReactNode;
}

const renderMarkdownWithSpacing = (content: string) => {
  // Split content by double line breaks for paragraphs, then by single line breaks
  const paragraphs = content.split('\n\n').filter(para => para.trim() !== '');
  
  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n').filter(line => line.trim() !== '');
    
    return (
      <div key={paragraphIndex} className={paragraphIndex > 0 ? 'mt-4' : ''}>
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
            <SecureInlineMarkdown content={line.trim()} />
          </div>
        ))}
      </div>
    );
  });
};

export const MarkdownCard: React.FC<MarkdownCardProps> = ({ title, image, href, children }) => {
  console.log('MarkdownCard render:', { title, image, href, hasChildren: !!children });
  
  const cardContent = (
    <div className="p-6 my-4 border rounded-xl dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {image && (
        <div className="w-10 h-10 mb-6 relative rounded-lg">
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="rounded-lg object-cover"
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              left: 0,
              top: 0,
            }}
          />
        </div>
      )}
      <span className="block text-base font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </span>
      <div className="mt-3 text-base text-slate-600 dark:text-slate-300">
        {typeof children === 'string' ? (
          renderMarkdownWithSpacing(children)
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (href) {
    console.log('MarkdownCard: Rendering as clickable link with href:', href);
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block no-underline hover:no-underline cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={(e) => {
          console.log('MarkdownCard: Link clicked!', href);
          // Let the default behavior handle the navigation
        }}
      >
        {cardContent}
      </a>
    );
  }

  console.log('MarkdownCard: Rendering as non-clickable card');
  return cardContent;
};
