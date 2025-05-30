import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/untitled-pageasd/commands",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_untitled_pageasd_commands() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_untitled_pageasd_commands.displayName = 'MDX_extensions_plugins_extensions_plugins_untitled_pageasd_commands';
MDX_extensions_plugins_extensions_plugins_untitled_pageasd_commands.frontmatter = frontmatter;
