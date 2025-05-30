
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
        <ReactMarkdown 
          className="prose prose-sm dark:prose-invert max-w-none prose-p:text-sm prose-p:mb-2 prose-p:leading-relaxed prose-headings:text-base prose-headings:font-semibold prose-headings:mb-2 prose-ul:my-2 prose-li:my-0 prose-li:text-sm"
        >
          {children}
        </ReactMarkdown>
      );
    }
    return children;
  }, [children]);
  
  const cardContent = (
    <div className={cn(
      "relative w-full rounded-lg p-6 shadow-md bg-white dark:bg-card",
      "border border-gray-200 dark:border-border",
      "transition-all duration-300",
      isClickable && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
      "group overflow-hidden",
      className
    )}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
      
      <div className="relative flex flex-col md:flex-row gap-y-4 md:gap-x-6 h-full">
        {/* Icon or Image */}
        {(icon || image) && (
          <div className="flex-shrink-0">
            {icon ? (
              // Icon display - proper sizing
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                {icon.startsWith('/') || icon.startsWith('http') ? (
                  <img 
                    src={icon} 
                    alt={title || ''} 
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-xl">{icon}</span>
                )}
              </div>
            ) : image && (
              // Full image display
              <div className="relative w-full md:w-48 h-48 sm:h-32 md:h-full overflow-hidden rounded-lg">
                <img 
                  src={image} 
                  alt={title || ''} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              </div>
            )}
          </div>
        )}
        
        {/* Content wrapper */}
        <div className="flex-grow space-y-2">
          {/* Title */}
          {title && (
            <h3 className="text-base sm:text-lg font-semibold flex items-center justify-between transition-colors duration-300 group-hover:text-primary">
              <span className="line-clamp-2">{title}</span>
              {isClickable && (
                <ArrowUpRight className={cn(
                  "w-4 h-4 ml-2 flex-shrink-0 transition-all duration-300",
                  "opacity-0 group-hover:opacity-100",
                  "transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0"
                )} />
              )}
            </h3>
          )}
          
          {/* Content */}
          {children && (
            <div className="text-sm sm:text-base text-muted-foreground mt-2">
              {processedChildren}
            </div>
          )}
        </div>
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
          className="block no-underline hover:no-underline"
        >
          {cardContent}
        </a>
      );
    } else {
      return (
        <a 
          href={href}
          className="block no-underline hover:no-underline"
        >
          {cardContent}
        </a>
      );
    }
  }

  return cardContent;
}
