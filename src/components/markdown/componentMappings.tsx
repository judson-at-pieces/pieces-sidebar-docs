import React from 'react';
import Accordion from './Accordion';
import AccordionGroup from './AccordionGroup';
import Button from './Button';
import { Callout } from './Callout';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { CodeBlock } from './CodeBlock';
import { CustomTable } from './CustomTable';
import { ExpandableImage } from './ExpandableImage';
import HorizontalRule from './HorizontalRule';
import { Image } from './Image';
import { MarkdownCard } from './MarkdownCard';
import { PiecesCloudModels } from './PiecesCloudModels';
import { PiecesLocalModels } from './PiecesLocalModels';
import SimpleCard from './SimpleCard';
import { Steps } from './Steps';
import Table from './Table';
import { TableOfContents } from './TableOfContents';
import { Tabs, TabItem } from './Tabs';
import Typography from './Typography';

interface ComponentProps {
  children?: React.ReactNode;
  [key: string]: any;
}

interface CardProps {
  children: React.ReactNode;
  title: string;
}

function Card({ children, title }: CardProps) {
  return (
    <div className="border rounded-lg p-4 my-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

// Map component names to their actual components
export const componentMap: Record<string, React.ComponentType<any>> = {
  // Layout Components
  Card: (props: ComponentProps & { title?: string; children?: React.ReactNode }) => (
    <Card title={props.title || 'Untitled'}>
      {props.children || <div>No content provided</div>}
    </Card>
  ),
  CardGroup: (props: ComponentProps & { children: React.ReactNode }) => <CardGroup {...props} />,
  SimpleCard: (props: ComponentProps & { title?: string; children?: React.ReactNode }) => <SimpleCard title={props.title || 'Untitled'} {...props} />,
  
  // Interactive Components
  Accordion: (props: ComponentProps & { title: string; children: React.ReactNode }) => <Accordion {...props} />,
  AccordionGroup: (props: ComponentProps & { children: React.ReactNode }) => <AccordionGroup {...props} />,
  Button: (props: ComponentProps & { label: string }) => <Button {...props} />,
  Callout: (props: ComponentProps & { children: React.ReactNode }) => <Callout {...props} />,
  
  // Content Components
  CodeBlock: (props: ComponentProps & { children: React.ReactNode }) => <CodeBlock {...props} />,
  Image: (props: ComponentProps & { src: string }) => <Image {...props} />,
  ExpandableImage: (props: ComponentProps & { src: string; alt: string }) => <ExpandableImage {...props} />,
  Table: (props: ComponentProps & { headers: string[]; rows: string[][] }) => <Table {...props} />,
  CustomTable: (props: ComponentProps & { children: React.ReactNode }) => <CustomTable {...props} />,
  
  // Navigation Components
  Steps: (props: ComponentProps & { children: React.ReactNode }) => <Steps {...props} />,
  Tabs: (props: ComponentProps & { children: any }) => <Tabs {...props} />,
  TabItem: (props: ComponentProps & { label: string; children: React.ReactNode }) => <TabItem title={props.title || props.label} {...props} />,
  TableOfContents: (props: ComponentProps & { content: string }) => <TableOfContents {...props} />,
  
  // Special Components
  HorizontalRule: () => <HorizontalRule />,
  PiecesCloudModels: () => <PiecesCloudModels />,
  PiecesLocalModels: () => <PiecesLocalModels />,
  
  // Dynamic Components
  MarkdownCard: (props: ComponentProps & {
    title: string;
    children: React.ReactNode;
    image?: string;
    url?: string;
    external?: boolean;
  }) => <MarkdownCard {...props} />
};

// Helper function to get component by name
export const getComponent = (name: string): React.ComponentType<any> | null => {
  return componentMap[name] || null;
};

// Export component names for validation
export const availableComponents = Object.keys(componentMap);

// Export function for creating component mappings
export const createComponentMappings = () => componentMap;
