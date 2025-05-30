
import React from 'react';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  image?: string;
  href?: string;
  external?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Card({ title, image, href, external, children, className }: CardProps) {
  const isExternal = external === 'true' || href?.startsWith('http');
  const isClickable = !!href;
  
  const cardContent = (
    <div className={cn(
      "relative overflow-hidden rounded-lg border-2 p-6 bg-card transition-all duration-300",
      isClickable && "cursor-pointer",
      "border-border hover:border-primary/20",
      "shadow-sm hover:shadow-xl",
      "hover:-translate-y-0.5",
      "group",
      className
    )}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {image && (
        <div className="relative mb-4 overflow-hidden rounded-md">
          <img 
            src={image} 
            alt={title || ''} 
            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        </div>
      )}
      {title && (
        <h3 className="relative text-lg font-semibold mb-2 flex items-center justify-between transition-colors duration-300 group-hover:text-primary">
          <span>{title}</span>
          {isClickable && (
            <ArrowUpRight className={cn(
              "w-4 h-4 transition-all duration-300",
              "opacity-0 group-hover:opacity-100",
              "transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0"
            )} />
          )}
        </h3>
      )}
      {children && (
        <div className="relative text-sm text-muted-foreground">
          {children}
        </div>
      )}
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
