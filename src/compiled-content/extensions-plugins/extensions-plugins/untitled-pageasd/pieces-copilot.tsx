import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/untitled-pageasd/pieces-copilot",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_copilot() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_copilot.displayName = 'MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_copilot';
MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_copilot.frontmatter = frontmatter;
