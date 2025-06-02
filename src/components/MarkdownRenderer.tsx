
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css';
import { processCustomSyntax } from './markdown/customSyntaxProcessor';
import { createComponentMappings } from './markdown/componentMappings';
import { CustomComponents } from './markdown/types';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Use proper frontmatter handling and preserve markdown links
  const processedContent = React.useMemo(() => {
    try {
      // Remove frontmatter properly
      const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
      const finalContent = cleanContent.replace(/^\*\*\*\s*/, '');
      
      // Process custom syntax but preserve standard markdown inside cards
      let processed = processCustomSyntax(finalContent);
      
      // Handle the new :::card-component syntax - preserve inner markdown
      processed = processed.replace(
        /:::card-component\{([^}]*)\}\n([\s\S]*?):::/g,
        (match, attributes, innerContent) => {
          try {
            const titleMatch = attributes.match(/title="([^"]*)"/);
            const imageMatch = attributes.match(/image="([^"]*)"/);
            const hrefMatch = attributes.match(/href="([^"]*)"/);
            const externalMatch = attributes.match(/external="([^"]*)"/);
            const iconMatch = attributes.match(/icon="([^"]*)"/);
            
            const title = titleMatch ? titleMatch[1] : '';
            const image = imageMatch ? imageMatch[1] : '';
            const href = hrefMatch ? hrefMatch[1] : '';
            const external = externalMatch ? externalMatch[1] : '';
            const icon = iconMatch ? iconMatch[1] : '';
            
            // Preserve the markdown content exactly as is for Card component to process
            const preservedContent = innerContent.trim();
            
            return `<div data-card-component="true" data-title="${title}" data-image="${image}" data-href="${href}" data-external="${external}" data-icon="${icon}" data-preserve-markdown="true">\n\n${preservedContent}\n\n</div>`;
          } catch (error) {
            console.warn('Error parsing card-component attributes:', error);
            return `<div data-card-component="true" data-preserve-markdown="true">\n\n${innerContent}\n\n</div>`;
          }
        }
      );
      
      return processed;
    } catch (error) {
      console.error('Error processing markdown content:', error);
      return content; // Fallback to original content
    }
  }, [content]);

  console.log('Processing markdown content:', processedContent.substring(0, 200));

  return (
    <div className="markdown-content prose prose-gray dark:prose-invert max-w-none">
      <React.Suspense fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-4 bg-muted/70 rounded w-3/4"></div>
          <div className="h-4 bg-muted/70 rounded w-1/2"></div>
        </div>
      }>
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkBreaks,
            [remarkFrontmatter, { type: 'yaml', marker: '-' }]
          ]}
          rehypePlugins={[
            [rehypeRaw, { allowDangerousHtml: false }],
            [rehypeSanitize, {
              tagNames: [
                'p', 'br', 'strong', 'em', 'u', 'del', 'code', 'pre',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li',
                'blockquote',
                'a', 'img',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'div', 'span',
                'hr'
              ],
              attributes: {
                '*': ['className', 'style', 'id', 'data-*'],
                'a': ['href', 'target', 'rel', 'title'],
                'img': ['src', 'alt', 'width', 'height', 'title'],
                'div': ['dataType', 'dataTitle', 'dataImage', 'dataHref', 'dataExternal', 'dataCols', 'dataIcon', 'data-*'],
              },
              // Allow all protocols for links to work properly
              protocols: {
                href: ['http', 'https', 'mailto', 'tel']
              }
            }],
            rehypeHighlight
          ]}
          skipHtml={false}
          components={createComponentMappings() as CustomComponents}
        >
          {processedContent}
        </ReactMarkdown>
      </React.Suspense>
    </div>
  );
}
