import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface SecureInlineMarkdownProps {
  content: string;
}

export const SecureInlineMarkdown: React.FC<SecureInlineMarkdownProps> = ({ content }) => {
  // Process HTML links in the content before rendering
  const processedContent = content.replace(
    /href="([^"]*)"[^>]*>([^<]*)</g,
    '[$2]($1)'
  ).replace(
    /<a\s+[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi,
    '[$2]($1)'
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ href, children, ...props }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            {...props}
          >
            {children}
          </a>
        ),
        p: ({ children, ...props }) => (
          <span {...props}>{children}</span>
        )
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};
