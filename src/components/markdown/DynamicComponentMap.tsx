
import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from './ExpandableImage';
import { Image } from './Image';
import { Callout } from './Callout';
import { Steps, Step } from './Steps';
import { MarkdownCard as Card } from './MarkdownCard';
import { DynamicCardGroup as CardGroup } from './DynamicCardGroup';

export const createDynamicComponentMap = () => ({
  // Basic HTML elements
  a: ({ href, children, ...props }: any) => {
    if (href?.startsWith('/')) {
      return <Link to={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</Link>;
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</a>;
  },
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

  // Custom components
  ExpandableImage,
  Image,
  Callout,
  Steps,
  Step,
  Card: ({ title, image, children, ...props }: any) => {
    console.log('🎯 Dynamic Card component rendering:', { title, image, hasChildren: !!children });
    return <Card title={title} image={image} {...props}>{children}</Card>;
  },
  CardGroup: ({ cols, children, ...props }: any) => {
    console.log('🎯 Dynamic CardGroup component rendering:', { cols, childrenCount: React.Children.count(children) });
    return <CardGroup cols={cols} {...props}>{children}</CardGroup>;
  },
});

export type DynamicComponentMap = ReturnType<typeof createDynamicComponentMap>;
