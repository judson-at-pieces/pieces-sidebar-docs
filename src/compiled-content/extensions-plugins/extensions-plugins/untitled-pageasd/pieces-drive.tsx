import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/untitled-pageasd/pieces-drive",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_drive() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_drive.displayName = 'MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_drive';
MDX_extensions_plugins_extensions_plugins_untitled_pageasd_pieces_drive.frontmatter = frontmatter;
