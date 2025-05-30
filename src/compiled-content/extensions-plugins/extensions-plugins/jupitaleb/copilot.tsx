import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/copilot",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot';
MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot.frontmatter = frontmatter;
