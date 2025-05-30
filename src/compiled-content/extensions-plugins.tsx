import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Extensions & Plugins",
  "path": "/extensions-plugins",
  "visibility": "PUBLIC"
};

const markdownContent = `
# Extensions & Plugins

Pieces integrates seamlessly with your favorite development tools through our extensions and plugins.

## Available Extensions

### IDE Extensions
- **[Visual Studio Code](/docs/extensions-plugins/visual-studio-code)** - Full-featured VS Code extension
- **[JetBrains](/docs/extensions-plugins/jetbrains)** - Support for all JetBrains IDEs
- **[Visual Studio](/docs/extensions-plugins/visual-studio)** - Microsoft Visual Studio integration
- **[Sublime Text](/docs/extensions-plugins/sublime)** - Lightweight Sublime Text plugin
- **[Neovim](/docs/extensions-plugins/neovim-plugin)** - Vim-based editor support

### Other Integrations
- **[JupyterLab](/docs/extensions-plugins/jupyterlab)** - Jupyter notebook integration

Choose an extension above to get started!`;

export default function MDX_extensions_plugins() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins.displayName = 'MDX_extensions_plugins';
MDX_extensions_plugins.frontmatter = frontmatter;
