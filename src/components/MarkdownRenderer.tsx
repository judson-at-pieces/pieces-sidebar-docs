
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import { processCustomSyntax } from './markdown/customSyntaxProcessor';
import { createComponentMappings } from './markdown/componentMappings';
import { CustomComponents } from './markdown/types';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Remove frontmatter (everything between --- markers at the start)
  const cleanContent = content.replace(/^---[\s\S]*?---\s*/, '');
  
  // Remove the *** separator that comes after frontmatter
  const finalContent = cleanContent.replace(/^\*\*\*\s*/, '');
  
  const processedContent = processCustomSyntax(finalContent);

  return (
    <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-20">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeRaw, { allowDangerousHtml: true }],
          rehypeHighlight
        ]}
        skipHtml={false}
        components={createComponentMappings() as CustomComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
