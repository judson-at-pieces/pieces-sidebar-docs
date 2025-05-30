
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface CardProps {
  title?: string;
  image?: string;
  href?: string;
  external?: string;
  children?: React.ReactNode;
}

export function Card({ title, image, href, external, children }: CardProps) {
  const isExternal = external === 'true' || href?.startsWith('http');
  
  const cardContent = (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card">
      {image && (
        <div className="mb-4">
          <img src={image} alt={title || ''} className="w-full h-32 object-cover rounded" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          {title}
          {isExternal && <ExternalLink className="w-4 h-4" />}
        </h3>
      )}
      {children && (
        <div className="text-sm text-muted-foreground">
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
