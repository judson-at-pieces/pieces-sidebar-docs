
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  image?: string;
  icon?: string;
  href?: string;
  external?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Card({ title, image, icon, href, external, children, className }: CardProps) {
  const isExternal = external === 'true' || href?.startsWith('http');
  const isClickable = !!href;
  
  // Process children as markdown if it's a string
  const processedChildren = React.useMemo(() => {
    if (typeof children === 'string') {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-sm prose-p:mb-2 prose-p:leading-relaxed prose-headings:text-base prose-headings:font-semibold prose-headings:mb-2 prose-ul:my-2 prose-li:my-0 prose-li:text-sm prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400">
          <ReactMarkdown>
            {children}
          </ReactMarkdown>
        </div>
      );
    }
    return children;
  }, [children]);
  
  const cardContent = (
    <div className={cn(
      "relative w-full rounded-xl p-6 shadow-sm bg-white dark:bg-gray-900",
      "border border-gray-200 dark:border-gray-700",
      "transition-all duration-300 ease-in-out",
      isClickable && "cursor-pointer hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-600",
      "group overflow-hidden",
      className
    )}>
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
      
      <div className="relative flex flex-col gap-4 h-full">
        {/* Image Section */}
        {image && (
          <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <img 
              src={image} 
              alt={title || ''} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            {/* Gradient overlay on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          {icon && !image && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
              {icon.startsWith('/') || icon.startsWith('http') ? (
                <img 
                  src={icon} 
                  alt={title || ''} 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className="text-2xl">{icon}</span>
              )}
            </div>
          )}
          
          {/* Title and arrow */}
          <div className="flex-grow min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                <span className="line-clamp-2 pr-2">{title}</span>
                {isClickable && (
                  <ArrowUpRight className={cn(
                    "w-5 h-5 flex-shrink-0 text-gray-400 transition-all duration-300",
                    "opacity-0 group-hover:opacity-100 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0",
                    "group-hover:text-blue-500"
                  )} />
                )}
              </h3>
            )}
          </div>
        </div>
        
        {/* Content */}
        {children && (
          <div className="flex-grow text-gray-600 dark:text-gray-300 leading-relaxed">
            {processedChildren}
          </div>
        )}
        
        {/* External link indicator */}
        {isClickable && isExternal && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ExternalLink className="w-3 h-3" />
            <span>External link</span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    if (isExternal) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        >
          {cardContent}
        </a>
      );
    } else {
      return (
        <a 
          href={href}
          className="block no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        >
          {cardContent}
        </a>
      );
    }
  }

  return cardContent;
}
