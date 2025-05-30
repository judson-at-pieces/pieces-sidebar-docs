
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
          className="prose prose-sm dark:prose-invert max-w-none prose-p:mb-2 prose-p:leading-normal prose-headings:text-base prose-headings:font-semibold prose-headings:mb-2 prose-ul:my-2 prose-li:my-0"
        >
          {children}
        </ReactMarkdown>
      );
    }
    return children;
  }, [children]);
  
  const cardContent = (
    <div className={cn(
      "relative overflow-hidden rounded-lg border bg-card transition-all duration-300",
      isClickable && "cursor-pointer",
      "border-border hover:border-primary/20",
      "shadow-sm hover:shadow-md",
      "hover:-translate-y-0.5",
      "group",
      "p-4 sm:p-6",
      className
    )}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative flex flex-col h-full">
        {/* Icon or Image */}
        {(icon || image) && (
          <div className="mb-4">
            {icon ? (
              // Icon display - smaller and more appropriate size
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                {icon.startsWith('/') || icon.startsWith('http') ? (
                  <img 
                    src={icon} 
                    alt={title || ''} 
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl">{icon}</span>
                )}
              </div>
            ) : image && (
              // Full image display
              <div className="relative -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 overflow-hidden">
                <img 
                  src={image} 
                  alt={title || ''} 
                  className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              </div>
            )}
          </div>
        )}
        
        {/* Title */}
        {title && (
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center justify-between transition-colors duration-300 group-hover:text-primary">
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
          <div className="relative text-sm text-muted-foreground line-clamp-3 flex-grow">
            {processedChildren}
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
