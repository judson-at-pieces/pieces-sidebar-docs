import React from 'react';

// Header Components
interface HeaderProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const H1: React.FC<HeaderProps> = ({ id, children, className = '' }) => (
  <h1
    id={id}
    className={`scroll-mt-[var(--headings-scroll-mt)] text-3xl font-medium mb-6 text-slate-900 dark:text-slate-100 ${className}`}
  >
    {children}
  </h1>
);

export const H2: React.FC<HeaderProps> = ({ id, children, className = '' }) => (
  <h2
    id={id}
    className={`scroll-mt-[var(--headings-scroll-mt)] text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100 ${className}`}
  >
    {children}
  </h2>
);

export const H3: React.FC<HeaderProps> = ({ id, children, className = '' }) => (
  <h3
    id={id}
    className={`scroll-mt-[var(--headings-scroll-mt)] text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100 ${className}`}
  >
    {children}
  </h3>
);

// Paragraph Component
interface ParagraphProps {
  children: React.ReactNode;
  className?: string;
}

export const Paragraph: React.FC<ParagraphProps> = ({ children, className = '' }) => (
  <p className={`mb-6 text-base text-slate-700 dark:text-slate-300 ${className}`}>
    {children}
  </p>
);

// List Components
interface ListProps {
  children: React.ReactNode;
  className?: string;
}

export const UnorderedList: React.FC<ListProps> = ({ children, className = '' }) => (
  <ul className={`ml-6 list-disc space-y-1 mb-6 text-base text-slate-700 dark:text-slate-300 ${className}`}>
    {children}
  </ul>
);

export const OrderedList: React.FC<ListProps> = ({ children, className = '' }) => (
  <ol className={`ml-6 list-decimal space-y-1 mb-6 text-base text-slate-700 dark:text-slate-300 ${className}`}>
    {children}
  </ol>
);

export const ListItem: React.FC<ListProps> = ({ children, className = '' }) => (
  <li className={className}>
    {children}
  </li>
);

// Link Component
interface LinkProps {
  href: string;
  children: React.ReactNode;
  target?: '_blank' | '_self';
  rel?: string;
  className?: string;
}

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  target,
  rel,
  className = ''
}) => (
  <a
    href={href}
    target={target}
    rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
    className={`text-blue-600 hover:underline dark:text-blue-400 ${className}`}
  >
    {children}
  </a>
);

// Blockquote Component
interface BlockquoteProps {
  children: React.ReactNode;
  className?: string;
}

export const Blockquote: React.FC<BlockquoteProps> = ({ children, className = '' }) => (
  <blockquote className={`border-l-4 pl-4 italic my-6 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 ${className}`}>
    {children}
  </blockquote>
);

// Inline Code Component
interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export const InlineCode: React.FC<InlineCodeProps> = ({ children, className = '' }) => (
  <code className={`bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-sm font-mono ${className}`}>
    {children}
  </code>
);

// Export all components as default
const Typography = {
  H1,
  H2,
  H3,
  Paragraph,
  UnorderedList,
  OrderedList,
  ListItem,
  Link,
  Blockquote,
  InlineCode,
};

export default Typography;