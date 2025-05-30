import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/untitled-pageasd/get",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_untitled_pageasd_get() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_untitled_pageasd_get.displayName = 'MDX_extensions_plugins_extensions_plugins_untitled_pageasd_get';
MDX_extensions_plugins_extensions_plugins_untitled_pageasd_get.frontmatter = frontmatter;
