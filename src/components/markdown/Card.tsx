
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
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-sm prose-p:mb-1 prose-p:leading-relaxed prose-p:last:mb-0 prose-headings:text-sm prose-headings:font-medium prose-headings:mb-1 prose-ul:my-1 prose-li:my-0 prose-li:text-sm prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400 prose-a:font-medium prose-strong:font-semibold prose-em:italic">
          <ReactMarkdown
            components={{
              // Custom link component for proper styling within cards
              a: ({ href, children, ...props }) => {
                const isExternalLink = href?.startsWith('http');
                return (
                  <a 
                    href={href} 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
                    {...(isExternalLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Ensure paragraphs are properly spaced
              p: ({ children, ...props }) => (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-1 last:mb-0" {...props}>
                  {children}
                </p>
              ),
              // Handle strong/bold text
              strong: ({ children, ...props }) => (
                <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
                  {children}
                </strong>
              ),
              // Handle emphasis/italic text
              em: ({ children, ...props }) => (
                <em className="italic" {...props}>
                  {children}
                </em>
              )
            }}
          >
            {children}
          </ReactMarkdown>
        </div>
      );
    }
    return children;
  }, [children]);
  
  const cardContent = (
    <div className={cn(
      "relative w-full h-full rounded-lg p-4 border border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-900",
      "transition-all duration-200 ease-in-out",
      "flex flex-col gap-3",
      isClickable && "cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600 hover:-translate-y-0.5",
      "group overflow-hidden",
      className
    )}>
      
      <div className="flex flex-col gap-3 h-full">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3 flex-shrink-0">
          {/* Icon - treating image as icon */}
          {(image || icon) && (
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {image ? (
                <img 
                  src={image} 
                  alt={title || ''} 
                  className="w-6 h-6 object-contain"
                />
              ) : icon?.startsWith('/') || icon?.startsWith('http') ? (
                <img 
                  src={icon} 
                  alt={title || ''} 
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <span className="text-lg">{icon}</span>
              )}
            </div>
          )}
          
          {/* Title and arrow */}
          <div className="flex-grow min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0 flex items-start justify-between group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
                <span className="line-clamp-2 pr-2">{title}</span>
                {isClickable && (
                  <ArrowUpRight className={cn(
                    "w-4 h-4 flex-shrink-0 text-gray-400 transition-all duration-200",
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
          <div className="flex-grow leading-relaxed text-sm">
            {processedChildren}
          </div>
        )}
        
        {/* External link indicator */}
        {isClickable && isExternal && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-auto pt-2">
            <ExternalLink className="w-3 h-3" />
            <span>External</span>
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
          className="block no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg h-full"
        >
          {cardContent}
        </a>
      );
    } else {
      return (
        <a 
          href={href}
          className="block no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg h-full"
        >
          {cardContent}
        </a>
      );
    }
  }

  return cardContent;
}
