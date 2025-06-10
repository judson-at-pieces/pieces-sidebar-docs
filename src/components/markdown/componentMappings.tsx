import React from 'react';
import { MarkdownCard } from './MarkdownCard';
import { Image } from './Image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Steps } from './Steps';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { CustomTable } from './CustomTable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { CardGroup } from './CardGroup';
import { DynamicCardGroup } from './DynamicCardGroup';
import { HorizontalRule } from './HorizontalRule';
import { PiecesCloudModels } from './PiecesCloudModels';
import { PiecesLocalModels } from './PiecesLocalModels';
import { GlossaryAll } from './GlossaryAll';
import { Card } from './Card';
import { SimpleCard } from './SimpleCard';

interface ComponentMappings {
  [key: string]: React.ComponentType<any>;
}

interface TabItemProps {
  label: string;
  children: React.ReactNode;
}

const TabItem: React.FC<TabItemProps> = ({ children }) => {
  return <>{children}</>;
};

interface StepProps {
  children: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ children }) => {
  return <div className="step-content">{children}</div>;
};

const componentMappings: ComponentMappings = {
  h1: ({ children }) => <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-8 scroll-m-20 text-base font-semibold tracking-tight">{children}</h6>,
  p: ({ children }) => <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>,
  ol: ({ children }) => <ol className="mt-6 ml-4 list-decimal">{children}</ol>,
  ul: ({ children }) => <ul className="mt-6 ml-4 list-disc">{children}</ul>,
  li: ({ children }) => <li className="mt-2 leading-7">{children}</li>,
  a: ({ children, href, ...props }) => (
    <a href={href} className="font-medium text-primary underline underline-offset-4" {...props}>
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {children}
    </code>
  ),
  hr: HorizontalRule,
  table: ({ children }) => (
    <div className="my-6 w-full overflow-y-auto">
      <CustomTable>
        {children}
      </CustomTable>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="[&_th]:border-b font-medium [&:first-child]">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="[&_tr:nth-child(even)]:bg-muted">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" >{children}</tr>,
  th: ({ children }) => <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:not([align])]:text-left">{children}</th>,
  td: ({ children }) => <td className="p-4 align-middle [&:not([align])]:text-left">{children}</td>,
  Card,
  SimpleCard,
  CardGroup,
  DynamicCardGroup,
  Callout: ({ children, variant, title, icon, ...props }: any) => (
    <Callout variant={variant} title={title} icon={icon} {...props}>
      {children}
    </Callout>
  ),
  Accordion: ({ children, ...props }: any) => (
    <Accordion type="single" collapsible {...props}>
      {children}
    </Accordion>
  ),
  AccordionItem: ({ children, value, ...props }: any) => {
    const trigger = React.Children.toArray(children).find((child: any) => child.type === AccordionTrigger) as React.ReactElement;
    const content = React.Children.toArray(children).find((child: any) => child.type === AccordionContent) as React.ReactElement;

    return (
      <AccordionItem value={value} {...props}>
        {trigger}
        {content}
      </AccordionItem>
    );
  },
  AccordionTrigger: ({ children, ...props }: any) => (
    <AccordionTrigger {...props}>
      {children}
    </AccordionTrigger>
  ),
  AccordionContent: ({ children, ...props }: any) => (
    <AccordionContent {...props}>
      {children}
    </AccordionContent>
  ),
  CodeBlock: ({ children, language, title, ...props }: any) => (
    <CodeBlock language={language} title={title} {...props}>
      {children}
    </CodeBlock>
  ),
  PiecesCloudModels: PiecesCloudModels,
  PiecesLocalModels: PiecesLocalModels,
  GlossaryAll: GlossaryAll,
  MarkdownCard: ({ children, title, image, href, external, ...props }: any) => (
    <MarkdownCard 
      title={title}
      image={image}
      href={href}
      external={external}
      {...(props as object)}
    >
      {children}
    </MarkdownCard>
  ),

  Image: ({ src, alt, align, fullwidth, ...props }: any) => (
    <Image
      src={src}
      alt={alt}
      align={align}
      fullwidth={fullwidth}
      {...props}
    />
  ),

  Tabs: ({ children, ...props }: any) => {
    const processedChildren = React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.props.label) {
        return (
          <TabsContent key={index} value={child.props.label}>
            {child.props.children}
          </TabsContent>
        );
      }
      return child;
    });

    const tabLabels = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.props.label) {
        return child.props.label;
      }
      return null;
    }).filter(Boolean);

    return (
      <Tabs defaultValue={tabLabels?.[0]} {...props}>
        <TabsList>
          {tabLabels?.map((label) => (
            <TabsTrigger key={label} value={label}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {processedChildren}
      </Tabs>
    );
  },

  TabItem,

  Steps: ({ children, ...props }: any) => (
    <Steps {...props}>
      {children}
    </Steps>
  ),

  Step,
};

export { componentMappings, type ComponentMappings };
