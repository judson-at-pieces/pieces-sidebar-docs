import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/drive/share",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_share() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_share.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_share';
MDX_extensions_plugins_extensions_plugins_jupitaleb_drive_share.frontmatter = frontmatter;
