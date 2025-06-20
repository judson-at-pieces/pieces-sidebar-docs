
import React from 'react';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import { Steps, Step } from './Steps';
import { Tabs, TabItem } from './Tabs';
import Accordion from './Accordion';
import AccordionGroup from './AccordionGroup';
import Table from './Table';
import { Image } from './Image';
import { ExpandableImage } from './ExpandableImage';
import Button from './Button';
import HorizontalRule from './HorizontalRule';
import { TableOfContents } from './TableOfContents';
import { GlossaryAll } from './GlossaryAll';
import { Embed } from './Embed';
import { NewTab } from './NewTab';

export function createComponentMappings() {
  return {
    // Text elements
    h1: ({ children, ...props }: any) => (
      <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-3xl font-semibold mb-4 mt-6 text-foreground" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-2xl font-semibold mb-3 mt-5 text-foreground" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-xl font-semibold mb-2 mt-4 text-foreground" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 className="text-lg font-semibold mb-2 mt-3 text-foreground" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 className="text-base font-semibold mb-2 mt-3 text-foreground" {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-4 text-muted-foreground leading-7" {...props}>
        {children}
      </p>
    ),
    
    // Lists
    ul: ({ children, ...props }: any) => (
      <ul className="mb-4 ml-6 list-disc space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="mb-4 ml-6 list-decimal space-y-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-muted-foreground" {...props}>
        {children}
      </li>
    ),
    
    // Code - Handle inline vs block code properly
    code: ({ inline, children, className, ...props }: any) => {
      console.log('Code mapping called:', { inline, className, children });
      
      // For inline code (like `dxdiag`) - must return inline element
      if (inline) {
        return (
          <code 
            className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
            {...props}
          >
            {children}
          </code>
        );
      }
      
      // For block code, extract language and pass to CodeBlock
      const language = className ? className.replace(/^language-/, '') : undefined;
      
      // Force use the markdown CodeBlock with Go detection
      return <CodeBlock className={className} language={language}>{children}</CodeBlock>;
    },
    
    pre: ({ children, ...props }: any) => {
      console.log('Pre mapping called:', { children, props });
      
      // If pre contains code element, extract it and handle properly
      if (React.isValidElement(children) && children.type === 'code') {
        const codeProps = children.props as { className?: string; children?: React.ReactNode };
        const language = codeProps.className ? codeProps.className.replace(/^language-/, '') : undefined;
        return <CodeBlock className={codeProps.className} language={language}>{codeProps.children}</CodeBlock>;
      }
      
      // Otherwise, treat as code block
      return <CodeBlock>{children}</CodeBlock>;
    },
    
    // Links and emphasis - Fixed typography handling
    a: ({ children, href, ...props }: any) => (
      <a 
        href={href}
        className="text-primary underline underline-offset-4 hover:text-primary/80"
        {...props}
      >
        {children}
      </a>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    
    // Blockquote
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground" {...props}>
        {children}
      </blockquote>
    ),
    
    // Table
    table: ({ children, ...props }: any) => <Table {...props}>{children}</Table>,
    
    // Image
    img: ({ src, alt, ...props }: any) => <Image src={src} alt={alt} {...props} />,
    
    // Horizontal rule
    hr: HorizontalRule,
    
    // Custom components - Card mapping with COMPLETE href support
    Callout,
    CodeBlock,
    Card: ({ title, image, href, external, children, ...props }: any) => {
      console.log('🔥 Card mapping called with ALL PROPS:', { title, image, href, external, hasChildren: !!children, allProps: props });
      
      // Pass ALL possible link attributes to MarkdownCard
      return (
        <MarkdownCard 
          title={title} 
          image={image} 
          href={href}
          external={external}
          {...props}
        >
          {children}
        </MarkdownCard>
      );
    },
    MarkdownCard,
    CardGroup,
    Steps,
    Step,
    Tabs,
    TabItem,
    // Fixed Accordion components with proper boolean prop handling
    Accordion: ({ title, children, defaultOpen, ...props }: any) => {
      // Convert string "true"/"false" to boolean
      const isDefaultOpen = defaultOpen === true || defaultOpen === 'true';
      
      return (
        <Accordion 
          title={title} 
          defaultOpen={isDefaultOpen}
          {...props}
        >
          {children}
        </Accordion>
      );
    },
    AccordionGroup: ({ children, allowMultiple, ...props }: any) => {
      // Convert string "true"/"false" to boolean
      const isAllowMultiple = allowMultiple === true || allowMultiple === 'true';
      
      return (
        <AccordionGroup 
          allowMultiple={isAllowMultiple}
          {...props}
        >
          {children}
        </AccordionGroup>
      );
    },
    Button,
    TableOfContents,
    GlossaryAll,
    Embed,
    ExpandableImage,
    NewTab,
  };
}
