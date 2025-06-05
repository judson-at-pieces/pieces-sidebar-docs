
import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from './ExpandableImage';
import { Callout } from './Callout';
import { Steps, Step } from './Steps';
import { MarkdownCard as Card } from './MarkdownCard';
import { CardGroup } from './CardGroup';
import { CustomTable } from './CustomTable';
import { TableOfContents } from './TableOfContents';
import { Tabs } from './Tabs';
import { Accordion, AccordionItem } from './Accordion';
import { AccordionGroup } from './AccordionGroup';
import { Button } from './Button';
import { Image } from './Image';
import type { ReactNode } from 'react';

interface CustomTableProps {
  children: ReactNode;
}

export const createComponentMappings = () => ({
  // Links
  a: ({ href, children, ...props }: any) => {
    if (href?.startsWith('/')) {
      return <Link to={href} {...props}>{children}</Link>;
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  },
  
  // Tables
  table: ({ children, ...props }: CustomTableProps) => (
    <CustomTable {...props}>{children}</CustomTable>
  ),
  thead: ({ children, ...props }: { children: ReactNode }) => (
    <thead {...props}>{children}</thead>
  ),
  tbody: ({ children, ...props }: { children: ReactNode }) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }: { children: ReactNode }) => (
    <tr {...props}>{children}</tr>
  ),
  th: ({ children, ...props }: { children: ReactNode }) => (
    <th {...props}>{children}</th>
  ),
  td: ({ children, ...props }: { children: ReactNode }) => (
    <td {...props}>{children}</td>
  ),
  
  // Images - ensure all images have rounded edges
  img: ({ src, alt, title, ...props }: any) => (
    <ExpandableImage 
      src={src} 
      alt={alt || ''} 
      caption={title || ''} 
      className="rounded-lg"
      {...props} 
    />
  ),
  
  // Code blocks
  pre: ({ children, ...props }: { children: ReactNode }) => (
    <pre className="rounded-lg overflow-x-auto" {...props}>{children}</pre>
  ),
  code: ({ children, className, ...props }: any) => {
    if (className?.includes('language-')) {
      return <code className={className} {...props}>{children}</code>;
    }
    return <code className="rounded px-1.5 py-0.5" {...props}>{children}</code>;
  },
  
  // Custom components
  Image,
  ExpandableImage,
  Callout,
  Card,
  CardGroup,
  Steps,
  Step,
  TableOfContents,
  Tabs,
  Accordion,
  AccordionItem,
  AccordionGroup,
  Button,
});
