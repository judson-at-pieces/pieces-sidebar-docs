import React from 'react';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { Steps } from './Steps';
import { Tabs } from './Tabs';
import Accordion from './Accordion';
import AccordionGroup from './AccordionGroup';
import Table from './Table';
import { Image } from './Image';
import Button from './Button';
import HorizontalRule from './HorizontalRule';

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
    
    // Code - Enhanced to pass language information
    code: ({ inline, children, className, ...props }: any) => {
      console.log('Code element:', { inline, className, children: typeof children === 'string' ? children.substring(0, 50) : children });
      
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
      // Extract language from className (e.g., "language-javascript" -> "javascript")
      const language = className ? className.replace('language-', '') : undefined;
      return <CodeBlock className={className} language={language} {...props}>{children}</CodeBlock>;
    },
    pre: ({ children, className, ...props }: any) => {
      console.log('Pre element:', { className, children });
      
      // Check if the pre contains a code element with language info
      if (React.isValidElement(children) && children.props && children.props.className) {
        const codeClassName = children.props.className;
        const language = codeClassName ? codeClassName.replace('language-', '') : undefined;
        
        // Pass the language info to CodeBlock
        return <CodeBlock className={codeClassName} language={language}>{children.props.children}</CodeBlock>;
      }
      
      // If the pre contains a code element, pass through the children
      // The CodeBlock component will handle the styling
      return children;
    },
    
    // Links and emphasis
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
    
    // Custom components
    Callout,
    CodeBlock,
    Card,
    CardGroup,
    Steps,
    Tabs,
    Accordion,
    AccordionGroup,
    Button,
  };
}
