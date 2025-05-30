import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/get-started",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_get_started() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_get_started.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_get_started';
MDX_extensions_plugins_extensions_plugins_jupitaleb_get_started.frontmatter = frontmatter;
