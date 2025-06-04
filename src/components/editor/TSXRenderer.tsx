
import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';
import { Image } from '@/components/markdown/Image';
import { Callout } from '@/components/markdown/Callout';
import { Steps, Step } from '@/components/markdown/Steps';
import { MarkdownCard as Card } from '@/components/markdown/MarkdownCard';
import { CardGroup } from '@/components/markdown/CardGroup';
import { 
  CustomTable, 
  CustomTableHeader, 
  CustomTableBody, 
  CustomTableRow, 
  CustomTableHead, 
  CustomTableCell 
} from '@/components/markdown/CustomTable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processCustomSyntax } from '@/components/markdown/customSyntaxProcessor';

interface TSXRendererProps {
  content: string;
}

export function TSXRenderer({ content }: TSXRendererProps) {
  // Process the content to match the compiled content format
  const processedContent = React.useMemo(() => {
    // If content doesn't start with frontmatter, add a basic one
    if (!content.startsWith('---')) {
      return `---
title: "Preview"
---
***
${content}`;
    }
    
    // If content has frontmatter but no section delimiter, add it
    if (!content.includes('***')) {
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd !== -1) {
        const frontmatter = content.substring(0, frontmatterEnd + 3);
        const markdownContent = content.substring(frontmatterEnd + 3).trim();
        return `${frontmatter}
***
${markdownContent}`;
      }
    }
    
    return content;
  }, [content]);

  // Extract markdown content after frontmatter and delimiter
  const markdownContent = React.useMemo(() => {
    const parts = processedContent.split('***');
    if (parts.length > 1) {
      return parts.slice(1).join('***').trim();
    }
    return processedContent;
  }, [processedContent]);

  // Process custom syntax
  const finalContent = React.useMemo(() => {
    return processCustomSyntax(markdownContent);
  }, [markdownContent]);

  // Create the same component mappings as compiled content
  const components = React.useMemo(() => ({
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('/')) {
        return <Link to={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</Link>;
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</a>;
    },
    table: CustomTable,
    thead: CustomTableHeader,
    tbody: CustomTableBody,
    tr: CustomTableRow,
    th: CustomTableHead,
    td: CustomTableCell,
    h1: ({ children, ...props }: any) => <h1 className="scroll-m-20 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight" {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 className="scroll-m-20 pb-2 text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 className="scroll-m-20 pb-2 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 className="scroll-m-20 pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h4>,
    pre: ({ children, ...props }: any) => <pre className="rounded-md border bg-secondary text-sm text-secondary-foreground" {...props}>{children}</pre>,
    code: ({ children, ...props }: any) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>{children}</code>,
    ul: ({ children, ...props }: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    blockquote: ({ children, ...props }: any) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>{children}</blockquote>,
    p: ({ children, ...props }: any) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>{children}</p>,
    hr: ({ ...props }: any) => <hr className="my-4 md:my-8" {...props} />,
    img: ({ src, alt, ...props }: any) => <Image src={src} alt={alt} {...props} />,
    // Handle custom components
    div: ({ children, ...props }: any) => {
      // Get data attributes
      const dataProps = Object.keys(props).reduce((acc, key) => {
        if (key.startsWith('data-')) {
          const cleanKey = key.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          acc[cleanKey] = props[key as keyof typeof props];
        }
        return acc;
      }, {} as Record<string, any>);

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
        const colsNumber = typeof dataProps.cols === 'string' ? parseInt(dataProps.cols) : dataProps.cols;
        const validCols = [2, 3, 4].includes(colsNumber) ? colsNumber as 2 | 3 | 4 : 2;
        return <CardGroup cols={validCols} {...props}>{children}</CardGroup>;
      }
      
      if (dataProps.card === 'true') {
        return <Card title={dataProps.title} image={dataProps.image} icon={dataProps.icon} href={dataProps.href} external={dataProps.external}>{children}</Card>;
      }
      
      return <div {...props}>{children}</div>;
    },
    // Direct component mappings
    ExpandableImage,
    Callout,
    Steps,
    Step,
    Card,
    CardGroup,
  }), []);
  
  return (
    <div className="h-full p-6 bg-muted/10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
          <div className="mb-4 text-sm text-muted-foreground border-b border-border pb-2">
            <span className="font-medium">Live Preview</span>
            <p className="text-xs mt-1">This shows exactly how the content will appear on the docs site.</p>
          </div>
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {finalContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
