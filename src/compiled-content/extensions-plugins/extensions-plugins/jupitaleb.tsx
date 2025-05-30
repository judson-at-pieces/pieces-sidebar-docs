import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb",
  "visibility": "HIDDEN"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb';
MDX_extensions_plugins_extensions_plugins_jupitaleb.frontmatter = frontmatter;
