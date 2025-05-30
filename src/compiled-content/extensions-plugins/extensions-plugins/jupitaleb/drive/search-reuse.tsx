import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/drive/search-reuse",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_search_reuse() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_search_reuse.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_search_reuse';
MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_search_reuse.frontmatter = frontmatter;
