import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/jupitaleb/copilot/llm-settings",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_llm_settings() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_llm_settings.displayName = 'MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_llm_settings';
MDX_extensions_plugins_extensions_plugins_jupitaleb_copilot_llm_settings.frontmatter = frontmatter;
