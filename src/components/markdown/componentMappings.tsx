
import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage as ExpandableImageComponent } from './ExpandableImage';
import { Image } from './Image';
import { Callout } from './Callout';
import { Steps, Step } from './Steps';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import Card from './SimpleCard';
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from './CustomTable';
import Table from './Table';
import { CodeBlock } from './CodeBlock';
import { PiecesCloudModels } from './PiecesCloudModels';
import { PiecesLocalModels } from './PiecesLocalModels';
import { GlossaryAll } from './GlossaryAll';
import Accordion from './Accordion';
import AccordionGroup, { AccordionItem } from './AccordionGroup';
import Button from './Button';
import HorizontalRule from './HorizontalRule';
import Tabs, { TabItem } from './Tabs';
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
    return <Callout type={type as 'info' | 'tip' | 'alert'} {...props}>{children}</Callout>;
  },
  
  accordion: ({ title, defaultOpen, children, ...props }: any) => {
    return <Accordion title={title} defaultOpen={defaultOpen} {...props}>{children}</Accordion>;
  },
  
  accordiongroup: ({ allowMultiple, children, ...props }: any) => {
    return <AccordionGroup allowMultiple={allowMultiple} {...props}>{children}</AccordionGroup>;
  },
  
  accordionitem: ({ title, children, ...props }: any) => {
    return <AccordionItem title={title} isOpen={false} onToggle={() => {}} {...props}>{children}</AccordionItem>;
  },
  
  button: ({ label, linkHref, openLinkInNewTab, align, lightColor, darkColor, onClick, ...props }: any) => {
    return <Button label={label} linkHref={linkHref} openLinkInNewTab={openLinkInNewTab} align={align} lightColor={lightColor} darkColor={darkColor} onClick={onClick} {...props} />;
  },
  
  horizontalrule: ({ className, ...props }: any) => {
    return <HorizontalRule className={className} {...props} />;
  },
  
  tabs: ({ defaultActiveTab, children, ...props }: any) => {
    return <Tabs defaultActiveTab={defaultActiveTab} {...props}>{children}</Tabs>;
  },
  
  tabitem: ({ title, children, ...props }: any) => {
    return <TabItem title={title} {...props}>{children}</TabItem>;
  },
  
  table: ({ headers, rows, className, ...props }: any) => {
    return <Table headers={headers} rows={rows} className={className} {...props} />;
  },
  
  steps: ({ children, ...props }: any) => {
    return <Steps {...props}>{children}</Steps>;
  },
  
  step: ({ title, children, ...props }: any) => {
    return <Step title={title} {...props}>{children}</Step>;
  },
  
  card: ({ title, image, href, external, children, ...props }: any) => {
    // If href is provided, use MarkdownCard for link functionality
    if (href) {
      return <MarkdownCard title={title} image={image} href={href} external={external} {...props}>{children}</MarkdownCard>;
    }
    // Otherwise use the simple Card component
    return <Card title={title} image={image} {...props}>{children}</Card>;
  },
  
  simplecard: ({ title, image, children, ...props }: any) => {
    return <Card title={title} image={image} {...props}>{children}</Card>;
  },
  
  cardgroup: ({ cols, children, ...props }: any) => {
    const colsNumber = typeof cols === 'string' ? parseInt(cols) : cols;
    const validCols = [2, 3, 4].includes(colsNumber) ? colsNumber as 2 | 3 | 4 : 2;
    return <CardGroup cols={validCols} {...props}>{children}</CardGroup>;
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

  // Explicit ExpandableImage component handler
  ExpandableImage: ({ src, alt, caption, ...props }: ImageProps) => {
    return <ExpandableImageComponent src={src} alt={caption as string} caption={(caption as string) || ''} {...props} />;
  },

  // Custom div handler for callouts, steps, cards, and card groups
  div: ({ children, ...props }: DivProps) => {
    // Get data attributes directly from props object
    const dataProps = Object.keys(props).reduce((acc, key) => {
      if (key.startsWith('data-')) {
        const cleanKey = key.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        acc[cleanKey] = props[key as keyof typeof props];
      }
      return acc;
    }, {} as Record<string, any>);

    console.log('Div component mapping - dataProps:', dataProps, 'hasChildren:', !!children);
    
    if (dataProps.callout) {
      return <Callout type={dataProps.callout as 'info' | 'tip' | 'alert'} {...props}>{children}</Callout>;
    }
    
    if (dataProps.steps === 'true') {
      return <Steps {...props}>{children}</Steps>;
    }
    
    if (dataProps.step) {
      return <Step title={dataProps.stepTitle || dataProps.title || ''} {...props}>{children}</Step>;
    }
    
    if (dataProps.cardgroup === 'true') {
      console.log('Rendering CardGroup with cols:', dataProps.cols, 'children count:', React.Children.count(children));
      const colsNumber = typeof dataProps.cols === 'string' ? parseInt(dataProps.cols) : dataProps.cols;
      const validCols = [2, 3, 4].includes(colsNumber) ? colsNumber as 2 | 3 | 4 : 2;
      return <CardGroup cols={validCols} {...props}>{children}</CardGroup>;
    }
    
    if (dataProps.card === 'true' || dataProps.cardComponent === 'true') {
      console.log('Rendering Card with:', { 
        title: dataProps.title, 
        image: dataProps.image, 
        href: dataProps.href, 
        external: dataProps.external, 
        hasChildren: !!children 
      });
      
      let cardContent = children;
      if (React.isValidElement(children) || Array.isArray(children)) {
        const extractTextFromChildren = (node: any): string => {
          if (typeof node === 'string') return node;
          if (typeof node === 'number') return String(node);
          if (Array.isArray(node)) return node.map(extractTextFromChildren).join('');
          if (React.isValidElement(node)) {
            if (node.props && typeof node.props === 'object' && 'children' in node.props) {
              return extractTextFromChildren(node.props.children);
            }
          }
          return '';
        };
        cardContent = extractTextFromChildren(children);
      }
      
      return <MarkdownCard title={dataProps.title} image={dataProps.image} icon={dataProps.icon} href={dataProps.href} external={dataProps.external}>{cardContent}</MarkdownCard>;
    }
    
    if (dataProps.image && dataProps.src) {
      return <Image src={dataProps.src} alt={dataProps.alt} caption={dataProps.caption} align={dataProps.align as any} fullwidth={dataProps.fullwidth} />;
    }
    
    if (dataProps.piecesCloudModels) {
      return <PiecesCloudModels />;
    }

    if (dataProps.piecesLocalModels) {
      return <PiecesLocalModels />;
    }

    if (dataProps.glossaryAll) {
      return <GlossaryAll />;
    }
    
    if (dataProps.accordion === 'true') {
      return <Accordion title={dataProps.title || ''} defaultOpen={dataProps.defaultOpen === 'true'} {...props}>{children}</Accordion>;
    }
    
    if (dataProps.accordiongroup === 'true') {
      return <AccordionGroup allowMultiple={dataProps.allowMultiple === 'true'} {...props}>{children}</AccordionGroup>;
    }
    
    if (dataProps.button === 'true') {
      return <Button 
        label={dataProps.label || ''} 
        linkHref={dataProps.linkHref} 
        openLinkInNewTab={dataProps.openLinkInNewTab === 'true'} 
        align={dataProps.align as any} 
        lightColor={dataProps.lightColor} 
        darkColor={dataProps.darkColor} 
        {...props} 
      />;
    }
    
    if (dataProps.tabs === 'true') {
      return <Tabs defaultActiveTab={parseInt(dataProps.defaultActiveTab) || 0} {...props}>{children}</Tabs>;
    }
    
    if (dataProps.tabitem === 'true') {
      return <TabItem title={dataProps.title || ''} {...props}>{children}</TabItem>;
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
    <CodeBlock {...props}>{children}</CodeBlock>
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
    <HorizontalRule {...props} />
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
