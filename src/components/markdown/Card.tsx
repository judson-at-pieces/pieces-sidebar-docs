
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  
  // Process children as markdown if it's a string, or extract markdown from React elements
  const processedChildren = React.useMemo(() => {
    let markdownContent = '';
    
    if (typeof children === 'string') {
      markdownContent = children;
    } else if (React.isValidElement(children) || Array.isArray(children)) {
      // Extract markdown content from React elements while preserving markdown syntax
      const extractMarkdownFromChildren = (node: any): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(extractMarkdownFromChildren).join('');
        if (React.isValidElement(node)) {
          // Check if this is a markdown link element
          if (node.type === 'a' && node.props.href) {
            const linkText = extractMarkdownFromChildren(node.props.children);
            return `[${linkText}](${node.props.href})`;
          }
          // Check if this is a strong/bold element
          if (node.type === 'strong') {
            const strongText = extractMarkdownFromChildren(node.props.children);
            return `**${strongText}**`;
          }
          // Check if this is an em/italic element
          if (node.type === 'em') {
            const emText = extractMarkdownFromChildren(node.props.children);
            return `*${emText}*`;
          }
          // Check if this is a code element
          if (node.type === 'code') {
            const codeText = extractMarkdownFromChildren(node.props.children);
            return `\`${codeText}\``;
          }
          // Check if this is a paragraph element
          if (node.type === 'p') {
            const pText = extractMarkdownFromChildren(node.props.children);
            return `${pText}\n\n`;
          }
          // For other elements, just extract the text content
          if (node.props && typeof node.props === 'object' && 'children' in node.props) {
            return extractMarkdownFromChildren(node.props.children);
          }
        }
        return '';
      };
      markdownContent = extractMarkdownFromChildren(children);
    } else {
      markdownContent = String(children || '');
    }

    // Only render markdown if we have content
    if (!markdownContent.trim()) {
      return null;
    }

    return (
      <div className="leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom link component for proper styling within cards
            a: ({ href, children, ...props }) => {
              const isExternalLink = href?.startsWith('http');
              const linkClasses = "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 underline hover:no-underline font-medium";
              
              return (
                <a 
                  href={href} 
                  className={linkClasses}
                  {...(isExternalLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking links
                  {...props}
                >
                  {children}
                  {isExternalLink && <ExternalLink className="inline w-3 h-3 ml-1" />}
                </a>
              );
            },
            // Ensure paragraphs are properly spaced and styled
            p: ({ children, ...props }) => (
              <p className="mb-2 last:mb-0 text-inherit leading-relaxed" {...props}>
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
            // Handle inline code properly
            code: ({ children, ...props }) => (
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-inherit" {...props}>
                {children}
              </code>
            ),
            // Handle lists properly
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-2 space-y-1 text-inherit" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1 text-inherit" {...props}>
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="text-inherit" {...props}>
                {children}
              </li>
            )
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    );
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
