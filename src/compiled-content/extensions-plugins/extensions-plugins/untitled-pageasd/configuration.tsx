import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Untitled Page",
  "path": "/extensions-plugins/untitled-pageasd/configuration",
  "visibility": "PUBLIC"
};

const markdownContent = ``;

export default function MDX_extensions_plugins_extensions_plugins_untitled_pageasd_configuration() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_untitled_pageasd_configuration.displayName = 'MDX_extensions_plugins_extensions_plugins_untitled_pageasd_configuration';
MDX_extensions_plugins_extensions_plugins_untitled_pageasd_configuration.frontmatter = frontmatter;
