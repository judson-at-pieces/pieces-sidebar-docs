
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
        <div className="leading-relaxed">
          <ReactMarkdown
            components={{
              // Custom link component for proper styling within cards
              a: ({ href, children, ...props }) => {
                const isExternalLink = href?.startsWith('http');
                return (
                  <a 
                    href={href} 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 underline hover:no-underline"
                    {...(isExternalLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Ensure paragraphs are properly spaced and styled
              p: ({ children, ...props }) => (
                <p className="mb-2 last:mb-0 text-inherit" {...props}>
                  {children}
                </p>
              ),
              // Handle strong/bold text with consistent color
              strong: ({ children, ...props }) => (
                <strong className="font-semibold text-inherit" {...props}>
                  {children}
                </strong>
              ),
              // Handle emphasis/italic text with consistent color
              em: ({ children, ...props }) => (
                <em className="italic text-inherit" {...props}>
                  {children}
                </em>
              ),
              // Render inline code as normal text
              code: ({ children, ...props }) => (
                <span className="text-inherit" {...props}>
                  {children}
                </span>
              ),
              // Render pre as normal text
              pre: ({ children, ...props }) => (
                <span className="text-inherit" {...props}>
                  {children}
                </span>
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
        {/* Header with icon and title side by side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Icon - no background, no styling */}
          {(image || icon) && (
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {image ? (
                <img 
                  src={image} 
                  alt={title || ''} 
                  className="w-8 h-8 object-contain"
                />
              ) : icon?.startsWith('/') || icon?.startsWith('http') ? (
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
          
          {/* Title and arrow in same row as icon */}
          {title && (
            <div className="flex-grow min-w-0 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
                {title}
              </h3>
              {isClickable && (
                <ArrowUpRight className={cn(
                  "w-4 h-4 flex-shrink-0 text-gray-400 transition-all duration-200",
                  "opacity-0 group-hover:opacity-100 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0",
                  "group-hover:text-blue-500"
                )} />
              )}
            </div>
          )}
        </div>
        
        {/* Content */}
        {children && (
          <div className="flex-grow leading-relaxed text-gray-700 dark:text-gray-300">
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
