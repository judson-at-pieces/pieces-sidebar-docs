import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/drive",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_drive() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_drive.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_drive';
MDX_extensions_plugins_extensions_plugins_jupitaleb_drive.frontmatter = frontmatter;
