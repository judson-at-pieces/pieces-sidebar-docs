
import React from 'react';

interface MarkdownCardProps {
  title: string;
  image?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
}

const MarkdownCard: React.FC<MarkdownCardProps> = ({ title, image, href, external, children }) => {
  console.log('🎯 MarkdownCard rendering:', { 
    title, 
    image, 
    href,
    external,
    hasChildren: !!children,
    childrenType: typeof children 
  });

  const cardContent = (
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
        {children}
      </div>
    </div>
  );

  if (href) {
    const linkProps = external 
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};
    
    return (
      <a href={href} {...linkProps} className="block no-underline">
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default MarkdownCard;

// Export named export for compatibility
export { MarkdownCard };
