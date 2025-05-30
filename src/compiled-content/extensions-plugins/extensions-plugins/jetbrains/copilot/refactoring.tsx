import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Refactoring Code",
  "path": "/extensions-plugins/jetbrains/copilot/refactoring",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Modifying your Code with Pieces Copilot

Modify your code to change error handling, rename functions, and add functionality in two ways.

### via Right-Click Menu

Right-click the highlighted code you want to modify, hover over \`Pieces\`, and click \`Modify Selection with Copilot\`.

After clicking \`Modify Selection with Copilot\`, Pieces Copilot will open the Copilot chat window in the JetBrains sidebar, showing the proposed changes.

Review the modifications and choose whether to accept them. If you do, the updates will automatically integrate into your codebase at the point where the code was selected, right at your cursor.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/jetbrains_plugin_assets/jetbrains_plugin_assets/pieces_copilot/refactoring/modify_code.gif" alt="" align="center" fullwidth="true" />
`;

export default function MDX_extensions_plugins_extensions_plugins_jetbrains_copilot_refactoring() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_jetbrains_copilot_refactoring.displayName = 'MDX_extensions_plugins_extensions_plugins_jetbrains_copilot_refactoring';
MDX_extensions_plugins_extensions_plugins_jetbrains_copilot_refactoring.frontmatter = frontmatter;
