
import React from 'react';
import { SecureInlineMarkdown } from './SecureInlineMarkdown';

interface MarkdownCardProps {
  title: string;
  image?: string;
  href?: string;
  children: React.ReactNode;
}

export const MarkdownCard: React.FC<MarkdownCardProps> = ({ title, image, href, children }) => {
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
          <SecureInlineMarkdown content={children} />
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block no-underline hover:no-underline"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};
