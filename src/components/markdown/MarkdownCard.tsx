
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface MarkdownCardProps {
  title?: string;
  description?: string;
  image?: string;
  href?: string;
  external?: string | boolean;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
}

export function MarkdownCard({ 
  title, 
  description, 
  image, 
  href, 
  external, 
  icon, 
  children, 
  className 
}: MarkdownCardProps) {
  console.log('🎯 MarkdownCard rendering:', { title, description, image, href, external, icon, hasChildren: !!children });
  
  const isExternal = external === true || external === 'true' || external === '1';
  
  const cardContent = (
    <Card className={`transition-all duration-200 hover:shadow-md border border-border/50 ${className || ''}`}>
      {(title || image) && (
        <CardHeader className="pb-3">
          {image && (
            <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-muted">
              <img 
                src={image} 
                alt={title || ''} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          {title && (
            <CardTitle className="text-lg font-semibold leading-tight">
              {title}
              {href && isExternal && (
                <ExternalLink className="inline ml-2 w-4 h-4" />
              )}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      {children && (
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
  
  if (href) {
    if (isExternal) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block no-underline"
        >
          {cardContent}
        </a>
      );
    } else {
      return (
        <a 
          href={href}
          className="block no-underline"
        >
          {cardContent}
        </a>
      );
    }
  }
  
  return cardContent;
}
