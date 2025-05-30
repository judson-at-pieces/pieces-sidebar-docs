import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/drive/edit-update",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_edit_update() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_edit_update.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_edit_update';
MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_edit_update.frontmatter = frontmatter;
