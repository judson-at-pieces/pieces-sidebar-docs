import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/copilot/documenting-code",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_documenting_code() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_documenting_code.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_documenting_code';
MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_documenting_code.frontmatter = frontmatter;
