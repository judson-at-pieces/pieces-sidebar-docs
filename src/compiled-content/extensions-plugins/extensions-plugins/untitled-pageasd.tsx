import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/untitled-pageasd",
  "visibility": "HIDDEN"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_untitled_pageasd() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_untitled_pageasd.displayName = 'MDX_extensions_plugins_extensions_plugins_untitled_pageasd';
MDX_extensions_plugins_extensions_plugins_untitled_pageasd.frontmatter = frontmatter;
