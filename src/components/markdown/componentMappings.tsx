
import React from 'react';
import { Components } from 'react-markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Info, CheckCircle, Lightbulb, Zap } from 'lucide-react';
import { processInlineMarkdown, validateUrl } from '@/utils/secureMarkdownProcessor';
import CodeBlock from '../CodeBlock';

interface CalloutProps {
  type: 'info' | 'warning' | 'error' | 'success' | 'tip' | 'alert';
  title?: string;
  children: React.ReactNode;
}

interface CardGroupProps {
  cols?: number;
  children: React.ReactNode;
}

interface CardProps {
  title: string;
  image?: string;
  href?: string;
  external?: boolean;
  icon?: string;
  children?: React.ReactNode;
}

interface StepProps {
  number: number;
  title?: string;
  children: React.ReactNode;
}

export const createComponentMappings = (): Components => {
  return {
    // Enhanced anchor tag handling for both markdown and raw HTML
    a: ({ href, children, target, rel, ...props }) => {
      console.log('🔗 Processing anchor tag:', { href, children, target, rel });
      
      if (!href || !validateUrl(href)) {
        console.warn('Invalid or missing href in anchor tag:', href);
        return <span className="text-muted-foreground">{children}</span>;
      }

      // Handle target="_blank" with proper security attributes
      const linkTarget = target === '_blank' ? '_blank' : undefined;
      const linkRel = target === '_blank' ? 'noopener noreferrer' : rel;

      return (
        <a
          href={href}
          target={linkTarget}
          rel={linkRel}
          className="text-primary hover:text-primary/80 underline hover:no-underline transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    },
    
    code: ({ children, className, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      // Check if this is inline code by looking at the node properties
      const isInline = !className || !className.includes('language-');

      if (isInline) {
        return (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>
            {children}
          </code>
        );
      }

      return (
        <CodeBlock language={language} {...props}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    },

    h1: ({ children, ...props }) => (
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6" {...props}>
        {children}
      </h1>
    ),

    h2: ({ children, ...props }) => (
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4" {...props}>
        {children}
      </h2>
    ),

    h3: ({ children, ...props }) => (
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3" {...props}>
        {children}
      </h3>
    ),

    h4: ({ children, ...props }) => (
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2" {...props}>
        {children}
      </h4>
    ),

    h5: ({ children, ...props }) => (
      <h5 className="scroll-m-20 text-lg font-semibold tracking-tight mb-2" {...props}>
        {children}
      </h5>
    ),

    h6: ({ children, ...props }) => (
      <h6 className="scroll-m-20 text-base font-semibold tracking-tight mb-2" {...props}>
        {children}
      </h6>
    ),

    p: ({ children, ...props }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6 mb-4" {...props}>
        {children}
      </p>
    ),

    ul: ({ children, ...props }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),

    ol: ({ children, ...props }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),

    li: ({ children, ...props }) => (
      <li className="mt-2" {...props}>
        {children}
      </li>
    ),

    blockquote: ({ children, ...props }) => (
      <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
        {children}
      </blockquote>
    ),

    table: ({ children, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full" {...props}>
          {children}
        </table>
      </div>
    ),

    thead: ({ children, ...props }) => (
      <thead {...props}>
        {children}
      </thead>
    ),

    tbody: ({ children, ...props }) => (
      <tbody {...props}>
        {children}
      </tbody>
    ),

    tr: ({ children, ...props }) => (
      <tr className="m-0 border-t p-0 even:bg-muted" {...props}>
        {children}
      </tr>
    ),

    th: ({ children, ...props }) => (
      <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props}>
        {children}
      </th>
    ),

    td: ({ children, ...props }) => (
      <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props}>
        {children}
      </td>
    ),

    hr: ({ ...props }) => <Separator className="my-4 md:my-8" {...props} />,

    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),

    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    img: ({ src, alt, ...props }) => {
      if (!src || !validateUrl(src)) {
        return (
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <span className="text-muted-foreground text-sm">Invalid or missing image source</span>
          </div>
        );
      }

      return (
        <img
          src={src}
          alt={alt || ''}
          className="rounded-lg max-w-full h-auto shadow-sm"
          loading="lazy"
          {...props}
        />
      );
    },

    // Custom components for special syntax
    div: ({ children, className, ...props }: any) => {
      // Handle callouts
      const calloutMatch = props['data-callout'];
      if (calloutMatch) {
        const calloutType = calloutMatch;
        const title = props['data-title'] || '';
        
        const getCalloutIcon = (type: string) => {
          switch (type) {
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'error': return <AlertTriangle className="h-4 w-4" />;
            case 'success': return <CheckCircle className="h-4 w-4" />;
            case 'tip': return <Lightbulb className="h-4 w-4" />;
            case 'alert': return <Zap className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
          }
        };

        const getCalloutVariant = (type: string) => {
          switch (type) {
            case 'warning': return 'default';
            case 'error': return 'destructive';
            default: return 'default';
          }
        };

        return (
          <Alert variant={getCalloutVariant(calloutType)} className="my-6">
            <div className="flex items-center gap-2">
              {getCalloutIcon(calloutType)}
              {title && <span className="font-semibold">{title}</span>}
            </div>
            <AlertDescription className="mt-2">
              {children}
            </AlertDescription>
          </Alert>
        );
      }

      // Handle CardGroup
      if (props['data-cardgroup']) {
        const cols = parseInt(props['data-cols'] || '2', 10);
        const gridClass = cols === 3 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1 md:grid-cols-2';
        
        return (
          <div className={`grid gap-6 my-6 ${gridClass}`}>
            {children}
          </div>
        );
      }

      // Handle individual Cards
      if (props['data-card']) {
        const title = props['data-title'] || '';
        const image = props['data-image'] || '';
        const href = props['data-href'] || '';
        const external = props['data-external'] === 'true';
        const icon = props['data-icon'] || '';

        const cardContent = (
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            {image && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={image} 
                  alt={title} 
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                {icon && <span className="text-lg">{icon}</span>}
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
            </CardHeader>
            {children && (
              <CardContent>
                <CardDescription>{children}</CardDescription>
              </CardContent>
            )}
          </Card>
        );

        if (href && validateUrl(href)) {
          return (
            <a 
              href={href} 
              target={external ? '_blank' : '_self'}
              rel={external ? 'noopener noreferrer' : undefined}
              className="block no-underline"
            >
              {cardContent}
            </a>
          );
        }

        return cardContent;
      }

      // Handle Steps container
      if (props['data-steps']) {
        return (
          <div className="my-6 space-y-6">
            {children}
          </div>
        );
      }

      // Handle individual Step
      if (props['data-step']) {
        const stepNumber = props['data-step'];
        const stepTitle = props['data-step-title'] || '';
        
        return (
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {stepNumber}
              </div>
            </div>
            <div className="flex-1">
              {stepTitle && (
                <h3 className="text-lg font-semibold mb-2">{stepTitle}</h3>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {children}
              </div>
            </div>
          </div>
        );
      }

      return <div className={className} {...props}>{children}</div>;
    }
  };
};
