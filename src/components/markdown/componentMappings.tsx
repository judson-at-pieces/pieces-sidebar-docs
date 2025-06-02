import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage as ExpandableImageComponent } from './ExpandableImage';
import { Image } from './Image';
import { Callout } from './Callout';
import { Steps, Step } from './Steps';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from './CustomTable';
import { PiecesCloudModels } from './PiecesCloudModels';
import { PiecesLocalModels } from './PiecesLocalModels';
import { GlossaryAll } from './GlossaryAll';
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
  // Handle custom components that are being rendered as raw HTML
  callout: ({ type, title, children, ...props }: any) => {
    return <Callout type={type as 'info' | 'warning' | 'tip' | 'error' | 'success' | 'alert'} title={title} {...props}>{children}</Callout>;
  },
  
  steps: ({ children, ...props }: any) => {
    return <Steps {...props}>{children}</Steps>;
  },
  
  step: ({ number, title, children, ...props }: any) => {
    const stepNumber = typeof number === 'string' ? parseInt(number, 10) : typeof number === 'number' ? number : 1;
    const validNumber = isNaN(stepNumber) ? 1 : stepNumber;
    const stepTitle = typeof title === 'string' ? title : typeof title === 'number' ? String(title) : '';
    return <Step number={validNumber} title={stepTitle} {...props}>{children}</Step>;
  },
  
  card: ({ title, image, href, external, children, ...props }: any) => {
    return <Card title={title} image={image} href={href} external={external} {...props}>{children}</Card>;
  },
  
  cardgroup: ({ cols, children, ...props }: any) => {
    return <CardGroup cols={cols} {...props}>{children}</CardGroup>;
  },
  
  'pieces-cloud-models': () => {
    return <PiecesCloudModels />;
  },
  
  'pieces-local-models': () => {
    return <PiecesLocalModels />;
  },
  
  'glossary-all': () => {
    return <GlossaryAll />;
  },
  
  // Explicit Image component handler
  Image: ({ src, alt, caption, align, fullwidth, title, ...props }: any) => {
    return <Image src={src} alt={alt} caption={caption} align={align} fullwidth={fullwidth} title={title} {...props} />;
  },
  
  // Explicit ExpandableImage component handler
  ExpandableImage: ({ src, alt, caption, ...props }: ImageProps) => {
    const safeCaption = typeof caption === 'string' ? caption : '';
    return <ExpandableImageComponent src={src} alt={alt} caption={safeCaption} {...props} />;
  },
  
  // Enhanced image handling for markdown images
  img: ({ src, alt, title, ...props }: ImageProps) => {
    // Use ExpandableImage for all markdown images
    const caption = (props['data-caption'] as string) || title || '';
    return <ExpandableImageComponent src={src || ''} alt={alt || ''} caption={caption} {...props} />;
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
    
    // Handle Image component
    const isImage = props['data-image'] as string;
    const imageSrc = props['data-src'] as string;
    const imageAlt = props['data-alt'] as string;
    const imageCaption = props['data-caption'] as string;
    const imageAlign = props['data-align'] as string;
    const imageFullwidth = props['data-fullwidth'] as string;
    
    // Handle pieces-cloud-models component
    const isPiecesCloudModels = props['data-pieces-cloud-models'] as string;
    const isPiecesLocalModels = props['data-pieces-local-models'] as string;
    const isGlossaryAll = props['data-glossary-all'] as string;
    
    if (calloutType) {
      return <Callout type={calloutType as 'info' | 'warning' | 'tip' | 'error' | 'success' | 'alert'} title={title} {...props}>{children}</Callout>;
    }
    
    if (isSteps) {
      return <Steps {...props}>{children}</Steps>;
    }
    
    if (stepNumber) {
      const validStepNumber = parseInt(stepNumber, 10);
      const finalStepNumber = isNaN(validStepNumber) ? 1 : validStepNumber;
      const safeStepTitle = stepTitle || '';
      return <Step number={finalStepNumber} title={safeStepTitle} {...props}>{children}</Step>;
    }
    
    if (isCardGroup) {
      return <CardGroup cols={cols} {...props}>{children}</CardGroup>;
    }
    
    if (isCard) {
      const icon = props['data-icon'] as string | undefined;
      return <Card title={title} image={image} icon={icon} href={href} external={external} {...props}>{children}</Card>;
    }
    
    if (isImage && imageSrc) {
      return <Image src={imageSrc} alt={imageAlt} caption={imageCaption} align={imageAlign as any} fullwidth={imageFullwidth} />;
    }
    
    if (isPiecesCloudModels) {
      return <PiecesCloudModels />;
    }

    if (isPiecesLocalModels) {
      return <PiecesLocalModels />;
    }

    if (isGlossaryAll) {
      return <GlossaryAll />;
    }
    
    return <div {...props}>{children}</div>;
  },
  
  // Custom link component to use React Router for internal links
  a: ({ href, children, ...props }: LinkProps) => {
    const linkClasses = "text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/50 hover:decoration-primary transition-colors font-medium";
    
    if (href?.startsWith('/')) {
      return (
        <Link to={href} className={linkClasses} {...props}>
          {children}
        </Link>
      );
    }
    
    const isExternal = href?.startsWith('http');
    return (
      <a 
        href={href} 
        className={`${linkClasses} ${isExternal ? 'after:content-["↗"] after:ml-1 after:text-xs after:opacity-70' : ''}`}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
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
    <h1 className="scroll-m-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight mt-0 mb-6 first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HeadingProps) => (
    <h2 className="scroll-m-20 text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight mt-8 mb-4 pb-2 border-b border-border first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HeadingProps) => (
    <h3 className="scroll-m-20 text-base sm:text-lg md:text-xl lg:text-2xl font-semibold tracking-tight mt-6 mb-3 first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: HeadingProps) => (
    <h4 className="scroll-m-20 text-base sm:text-lg font-semibold tracking-tight mt-4 mb-2 first:mt-0" id={generateHeadingId(children)} {...props}>
      {children}
    </h4>
  ),
  pre: ({ children, ...props }: CodeProps) => (
    <pre className="my-4 rounded-lg border bg-muted/50 dark:bg-muted/20 p-4 text-sm overflow-x-auto max-w-full font-mono leading-relaxed" {...props}>
      {children}
    </pre>
  ),
  code: ({ children, ...props }: CodeProps) => (
    <code className="relative rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground" {...props}>
      {children}
    </code>
  ),
  ul: ({ children, ...props }: ListProps) => (
    <ul className="my-4 ml-6 list-disc space-y-1 [&>li]:leading-relaxed" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ListProps) => (
    <ol className="my-4 ml-6 list-decimal space-y-1 [&>li]:leading-relaxed" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ListProps) => (
    <li className="py-0.5 [&>p]:mb-1 [&>p:last-child]:mb-0" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: ListProps) => (
    <blockquote className="my-6 border-l-4 border-primary/30 pl-6 italic text-muted-foreground bg-muted/30 py-4 rounded-r-lg" {...props}>
      {children}
    </blockquote>
  ),
  p: ({ children, ...props }: ListProps) => (
    <p className="mb-4 leading-relaxed text-base [&:last-child]:mb-0" {...props}>
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
