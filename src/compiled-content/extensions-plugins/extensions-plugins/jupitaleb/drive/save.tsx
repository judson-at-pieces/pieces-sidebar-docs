import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/drive/save",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_save() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_save.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_save';
MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_save.frontmatter = frontmatter;
