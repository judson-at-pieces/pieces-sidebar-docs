
import React from 'react';
import { SecureInlineMarkdown } from './SecureInlineMarkdown';

interface MarkdownCardProps {
  title: string;
  image?: string;
  children: React.ReactNode;
}

const MarkdownCard: React.FC<MarkdownCardProps> = ({ title, image, children }) => {
  console.log('🎯 MarkdownCard rendering:', { 
    title, 
    image, 
    hasChildren: !!children,
    childrenType: typeof children 
  });

  // Process children as markdown if it's a string
  const processedChildren = typeof children === 'string' 
    ? <SecureInlineMarkdown content={children} />
    : children;

  return (
    <div className="p-6 my-4 border rounded-xl bg-white dark:bg-[#2a2b2b] dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors shadow-sm">
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
        {processedChildren}
      </div>
    </div>
  );
};

export default MarkdownCard;

// Export named export for compatibility
export { MarkdownCard };
