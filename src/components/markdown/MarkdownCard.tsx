
import React from 'react';
import { SecureInlineMarkdown } from './SecureInlineMarkdown';

interface MarkdownCardProps {
  title: string;
  image?: string;
  href?: string;
  external?: string;
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

export const MarkdownCard: React.FC<MarkdownCardProps> = ({ title, image, href, external, children }) => {
  console.log('🔥 MarkdownCard FORCE RENDER:', { title, image, href, external, hasChildren: !!children });
  
  const cardContent = (
    <div className="p-6 my-4 border rounded-xl dark:border-slate-800/80 border-slate-200 bg-white dark:bg-slate-900 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-1">
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

  // Use href if available
  const linkUrl = href;
  
  if (linkUrl) {
    console.log('🔥 MAKING CARD CLICKABLE WITH URL:', linkUrl);
    return (
      <a 
        href={linkUrl} 
        className="block no-underline hover:no-underline"
        style={{ 
          textDecoration: 'none !important',
          color: 'inherit !important' 
        }}
      >
        {cardContent}
      </a>
    );
  }

  console.log('🔥 NON-CLICKABLE CARD');
  return cardContent;
};
