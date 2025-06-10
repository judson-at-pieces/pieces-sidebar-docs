import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import Card from './Card';
import CardGroup from './CardGroup';
import Callout from './Callout';
import CodeBlock from './CodeBlock';
import { ExpandableImage } from './markdown/ExpandableImage';
import { Steps } from './markdown/Steps';
import { Tabs } from './markdown/Tabs';

interface Props {
  markdown: string;
}

const componentMap = {
  Card: ({ node, ...props }: any) => (
    <Card {...props}>{props.children}</Card>
  ),
  CardGroup: ({ node, ...props }: any) => (
    <CardGroup {...props}>{props.children}</CardGroup>
  ),
  Callout: ({ node, ...props }: any) => (
    <Callout {...props}>{props.children}</Callout>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (!inline && language) {
      return (
        <CodeBlock language={language} {...props}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    }
    
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },

  img: ({ src, alt, ...props }: any) => {
    return <ExpandableImage src={src} alt={alt} {...props} />;
  },

  Steps: ({ node, ...props }: any) => (
    <Steps {...props}>{props.children}</Steps>
  ),
  Tabs: ({ node, ...props }: any) => (
    <Tabs {...props}>{props.children}</Tabs>
  ),
};

export function ComponentBasedMarkdownRenderer({ markdown }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={componentMap}
    >
      {markdown}
    </ReactMarkdown>
  );
}
