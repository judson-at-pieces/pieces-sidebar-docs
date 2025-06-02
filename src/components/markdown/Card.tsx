
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
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-xs prose-p:mb-1 prose-p:leading-relaxed prose-headings:text-xs prose-headings:font-medium prose-headings:mb-1 prose-ul:my-1 prose-li:my-0 prose-li:text-xs prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400">
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
      "relative w-full h-full rounded-md p-3 border border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-900",
      "transition-all duration-200 ease-in-out",
      "flex flex-col",
      isClickable && "cursor-pointer hover:shadow-sm hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-600",
      "group overflow-hidden",
      className
    )}>
      
      <div className="relative flex flex-col gap-2 h-full">
        {/* Image Section - smaller */}
        {image && (
          <div className="relative w-full h-20 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
            <img 
              src={image} 
              alt={title || ''} 
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
            />
          </div>
        )}
        
        {/* Header with icon and title */}
        <div className="flex items-start gap-2 flex-shrink-0">
          {/* Icon */}
          {icon && !image && (
            <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
              {icon.startsWith('/') || icon.startsWith('http') ? (
                <img 
                  src={icon} 
                  alt={title || ''} 
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <span className="text-sm">{icon}</span>
              )}
            </div>
          )}
          
          {/* Title and arrow */}
          <div className="flex-grow min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-start justify-between group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
                <span className="line-clamp-2 pr-1">{title}</span>
                {isClickable && (
                  <ArrowUpRight className={cn(
                    "w-3 h-3 flex-shrink-0 text-gray-400 transition-all duration-200",
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
          <div className="flex-grow text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
            {processedChildren}
          </div>
        )}
        
        {/* External link indicator */}
        {isClickable && isExternal && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-auto pt-1">
            <ExternalLink className="w-2.5 h-2.5" />
            <span className="text-xs">External</span>
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
          className="block no-underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 rounded-md h-full"
        >
          {cardContent}
        </a>
      );
    } else {
      return (
        <a 
          href={href}
          className="block no-underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 rounded-md h-full"
        >
          {cardContent}
        </a>
      );
    }
  }

  return cardContent;
}
