import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/copilot/chat",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_chat() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_chat.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_chat';
MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_chat.frontmatter = frontmatter;
