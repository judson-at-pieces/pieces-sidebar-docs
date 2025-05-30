import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Neovim Plugin",
  "path": "/extensions-plugins/neovim-plugin",
  "visibility": "PUBLIC"
};

const markdownContent = `<Image src="https://cdn.hashnode.com/res/hashnode/image/upload/v1729000694787/79790597-fea0-42e0-9092-cf2676aee243.png" alt="" align="center" fullwidth="true" />

V2 Documentation for the Pieces for Developers Neovim Plugin is under construction 🚧 ...
`;

export default function MDX_extensions_plugins_extensions_plugins_neovim_plugin() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_neovim_plugin.displayName = 'MDX_extensions_plugins_extensions_plugins_neovim_plugin';
MDX_extensions_plugins_extensions_plugins_neovim_plugin.frontmatter = frontmatter;
