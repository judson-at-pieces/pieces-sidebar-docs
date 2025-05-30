import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Glossary",
  "path": "/glossary",
  "visibility": "PUBLIC"
};

const markdownContent = `<glossary-all />
`;

export default function MDX_glossary() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_glossary.displayName = 'MDX_glossary';
MDX_glossary.frontmatter = frontmatter;
