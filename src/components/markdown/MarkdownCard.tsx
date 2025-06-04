
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ExternalLink } from 'lucide-react';

interface MarkdownCardProps {
  title?: string;
  image?: string;
  icon?: string;
  href?: string;
  external?: string;
  children?: React.ReactNode;
}

export function MarkdownCard({ title, image, icon, href, external, children }: MarkdownCardProps) {
  const CardWrapper = ({ children: cardChildren }: { children: React.ReactNode }) => {
    if (href) {
      const isExternal = external === 'true' || href.startsWith('http');
      
      if (isExternal) {
        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            {cardChildren}
          </a>
        );
      } else {
        return (
          <a 
            href={href}
            className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            {cardChildren}
          </a>
        );
      }
    }
    
    return <>{cardChildren}</>;
  };

  return (
    <CardWrapper>
      <Card className="h-full hover:shadow-md transition-shadow">
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg leading-tight flex items-center gap-3">
              {image && (
                <img 
                  src={image} 
                  alt={title || ''} 
                  className="w-8 h-8 object-contain rounded flex-shrink-0"
                />
              )}
              {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
              <span className="flex-1">{title}</span>
              {href && (external === 'true' || href.startsWith('http')) && (
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </CardTitle>
          </CardHeader>
        )}
        {children && (
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              {typeof children === 'string' ? (
                <ReactMarkdown
                  components={{
                    a: ({ href, children, ...props }) => {
                      const isExternal = href?.startsWith('http');
                      return (
                        <a 
                          href={href}
                          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/50 hover:decoration-primary transition-colors font-medium"
                          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    p: ({ children, ...props }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
                        {children}
                      </p>
                    ),
                  }}
                >
                  {children}
                </ReactMarkdown>
              ) : (
                children
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </CardWrapper>
  );
}
