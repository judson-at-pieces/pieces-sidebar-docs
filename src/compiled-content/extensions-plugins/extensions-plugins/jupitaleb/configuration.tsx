import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/configuration",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_configuration() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_configuration.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_configuration';
MDX_extensions_plugins_extensions_plugins_jupitaleb_configuration.frontmatter = frontmatter;
