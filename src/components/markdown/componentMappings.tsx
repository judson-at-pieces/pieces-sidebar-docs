
import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage as ExpandableImageComponent } from './ExpandableImage';
import { Callout } from './Callout';
import { Steps, Step } from './Steps';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from './CustomTable';
import { 
  CustomTableComponentProps, 
  ImageProps, 
  LinkProps, 
  DivProps, 
  HeadingProps, 
  CodeProps, 
  ListProps 
} from './types';

export const createComponentMappings = () => ({
  // Explicit ExpandableImage component handler
  ExpandableImage: ({ src, alt, caption, ...props }: ImageProps) => {
    console.log('🎯 SUCCESS: Rendering ExpandableImage', { src, alt, caption });
    return <ExpandableImageComponent src={src} alt={alt} caption={(caption as string) || ''} {...props} />;
  },

  // Custom div handler for callouts, steps, cards, and card groups
  div: ({ children, ...props }: DivProps) => {
    const calloutType = props['data-callout'] as string;
    const title = props['data-title'] as string;
    const isSteps = props['data-steps'] as string;
    const stepNumber = props['data-step'] as string;
    const stepTitle = props['data-step-title'] as string;
    const isCard = props['data-card'] as string;
    const isCardGroup = props['data-cardgroup'] as string;
    const cols = props['data-cols'] as string;
    const image = props['data-image'] as string;
    const href = props['data-href'] as string;
    const external = props['data-external'] as string;
    
    if (calloutType) {
      return <Callout type={calloutType as 'info' | 'warning' | 'tip' | 'error' | 'success' | 'alert'} title={title} {...props}>{children}</Callout>;
    }
    
    if (isSteps) {
      return <Steps {...props}>{children}</Steps>;
    }
    
    if (stepNumber) {
      return <Step number={parseInt(stepNumber)} title={stepTitle} {...props}>{children}</Step>;
    }
    
    if (isCardGroup) {
      return <CardGroup cols={cols} {...props}>{children}</CardGroup>;
    }
    
    if (isCard) {
      return <Card title={title} image={image} href={href} external={external} {...props}>{children}</Card>;
    }
    
    return <div {...props}>{children}</div>;
  },

  img: ({ src, alt, ...props }: ImageProps) => {
    const caption = (props['data-caption'] as string) || '';
    console.log('🖼️ Image component:', { src, alt, caption });
    return <ExpandableImageComponent src={src || ''} alt={alt || ''} caption={caption} {...props} />;
  },

  // Custom link component to use React Router for internal links
  a: ({ href, children, ...props }: LinkProps) => {
    if (href?.startsWith('/')) {
      return (
        <Link to={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>
        {children}
      </a>
    );
  },

  // Enhanced table styling using custom components
  table: ({ children, ...props }: CustomTableComponentProps) => (
    <CustomTable {...props}>{children}</CustomTable>
  ),
  thead: ({ children, ...props }: CustomTableComponentProps) => (
    <CustomTableHeader {...props}>{children}</CustomTableHeader>
  ),
  tbody: ({ children, ...props }: CustomTableComponentProps) => (
    <CustomTableBody {...props}>{children}</CustomTableBody>
  ),
  tr: ({ children, ...props }: CustomTableComponentProps) => (
    <CustomTableRow {...props}>{children}</CustomTableRow>
  ),
  th: ({ children, ...props }: CustomTableComponentProps) => (
    <CustomTableHead {...props}>{children}</CustomTableHead>
  ),
  td: ({ children, ...props }: CustomTableComponentProps) => (
    <CustomTableCell {...props}>{children}</CustomTableCell>
  ),

  h1: ({ children, ...props }: HeadingProps) => (
    <h1 className="scroll-m-20 text-4xl font-bold tracking-tight" id={generateHeadingId(children)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HeadingProps) => (
    <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HeadingProps) => (
    <h3 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: HeadingProps) => (
    <h4 className="scroll-m-20 pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h4>
  ),
  pre: ({ children, ...props }: CodeProps) => (
    <pre className="rounded-md border bg-secondary text-sm text-secondary-foreground" {...props}>
      {children}
    </pre>
  ),
  code: ({ children, ...props }: CodeProps) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>
      {children}
    </code>
  ),
  ul: ({ children, ...props }: ListProps) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ListProps) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ListProps) => (
    <li {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: ListProps) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
      {children}
    </blockquote>
  ),
  p: ({ children, ...props }: ListProps) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
      {children}
    </p>
  ),
  hr: ({ ...props }: Record<string, unknown>) => (
    <hr className="my-4 md:my-8" {...props} />
  ),
});

function generateHeadingId(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (React.isValidElement(children) && typeof children.props.children === 'string') {
    return children.props.children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  return '';
}
