
import React from 'react';
import { Callout } from '@/components/markdown/Callout';
import { Card } from '@/components/markdown/Card';
import { CardGroup } from '@/components/markdown/CardGroup';
import { Steps, Step } from '@/components/markdown/Steps';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  // Create a component that can render TSX content
  const renderTSXContent = () => {
    try {
      // Remove frontmatter if present
      const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
      
      // Create a safe evaluation environment with our components
      const componentMap = {
        Callout,
        Card,
        CardGroup,
        Steps,
        Step,
        ExpandableImage,
        // Add basic HTML elements that might be used
        div: 'div',
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        h4: 'h4',
        h5: 'h5',
        h6: 'h6',
        p: 'p',
        ul: 'ul',
        ol: 'ol',
        li: 'li',
        pre: 'pre',
        code: 'code',
        table: 'table',
        thead: 'thead',
        tbody: 'tbody',
        tr: 'tr',
        th: 'th',
        td: 'td',
        img: 'img',
        a: 'a',
        span: 'span',
        strong: 'strong',
        em: 'em',
        br: 'br',
      };

      // Simple JSX-like parsing for demonstration
      // In a real implementation, you'd want to use a proper JSX parser
      const processedContent = cleanContent
        .split('\n')
        .map((line, index) => {
          if (line.trim() === '') return <br key={index} />;
          
          // Handle Callout components
          if (line.includes('<Callout')) {
            const typeMatch = line.match(/type="([^"]+)"/);
            const type = typeMatch ? typeMatch[1] as any : 'info';
            const content = line.replace(/<Callout[^>]*>/, '').replace(/<\/Callout>/, '').trim();
            return <Callout key={index} type={type}>{content}</Callout>;
          }
          
          // Handle headings
          if (line.includes('<h2')) {
            const content = line.replace(/<h2[^>]*>/, '').replace(/<\/h2>/, '').trim();
            return <h2 key={index} className="text-2xl font-bold mb-4">{content}</h2>;
          }
          
          if (line.includes('<h3')) {
            const content = line.replace(/<h3[^>]*>/, '').replace(/<\/h3>/, '').trim();
            return <h3 key={index} className="text-xl font-semibold mb-3">{content}</h3>;
          }
          
          // Handle paragraphs
          if (line.includes('<p')) {
            const content = line.replace(/<p[^>]*>/, '').replace(/<\/p>/, '').trim();
            return <p key={index} className="mb-4">{content}</p>;
          }
          
          // Handle lists
          if (line.includes('<ul')) {
            return <ul key={index} className="list-disc list-inside mb-4"></ul>;
          }
          
          if (line.includes('<li>')) {
            const content = line.replace(/<li[^>]*>/, '').replace(/<\/li>/, '').trim();
            return <li key={index}>{content}</li>;
          }
          
          // Handle ExpandableImage
          if (line.includes('<ExpandableImage')) {
            const srcMatch = line.match(/src="([^"]+)"/);
            const altMatch = line.match(/alt="([^"]+)"/);
            const src = srcMatch ? srcMatch[1] : '/placeholder.svg';
            const alt = altMatch ? altMatch[1] : 'Image';
            return <ExpandableImage key={index} src={src} alt={alt} className="mb-4" />;
          }
          
          // Handle code blocks
          if (line.includes('<pre')) {
            const codeMatch = content.match(/<code[^>]*>([\s\S]*?)<\/code>/);
            const codeContent = codeMatch ? codeMatch[1] : 'console.log("Hello World");';
            return (
              <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
                <code className="text-sm">{codeContent}</code>
              </pre>
            );
          }
          
          // Default: render as plain text if no JSX detected
          if (!line.includes('<') && line.trim()) {
            return <p key={index} className="mb-2">{line}</p>;
          }
          
          return null;
        })
        .filter(Boolean);

      return <div className="tsx-content">{processedContent}</div>;
    } catch (error) {
      console.error('Error rendering TSX content:', error);
      return (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          <h3 className="font-bold mb-2">Rendering Error</h3>
          <p>There was an error rendering the TSX content. Please check your syntax.</p>
          <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="tsx-renderer prose prose-gray dark:prose-invert max-w-none">
      {renderTSXContent()}
    </div>
  );
}
