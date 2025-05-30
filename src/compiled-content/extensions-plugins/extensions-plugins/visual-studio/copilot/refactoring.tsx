import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Refactoring Code",
  "path": "/extensions-plugins/visual-studio/copilot/refactoring",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Modifying your Code with Pieces Copilot

Modify your code to change error handling, rename functions, and add functionality in one way.

### via Right-Click Menu

Right-click the highlighted code you want to modify, hover over \`Pieces\`, and click \`Modify Selection with Copilot\`.

Once you click \`Modify Selection with Copilot\`, Pieces Copilot opens the Chat window in the Visual Studio sidebar, showing the proposed changes.

Review the modifications and decide whether to \`Accept\` them or use the \`Insert at Cursor\` option to place the suggestion where your cursor is. The updates will automatically be added to your codebase at the selected point, right at your cursor.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/visual_studio_extension_assets/pieces_copilot/refactoring/modify_code_right_click.gif" alt="" align="center" fullwidth="true" />

This method provides a quick and efficient way to refactor and improve your code without disrupting your workflow.

<Callout type="tip">
  You can use \`Modify Selection with Copilot\` to add detailed logging to essential functions for better debugging and to break down long methods into smaller, more modular functions.
</Callout>
`;

export default function MDX_extensions_plugins_extensions_plugins_visual_studio_copilot_refactoring() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_extensions_plugins_extensions_plugins_visual_studio_copilot_refactoring.displayName = 'MDX_extensions_plugins_extensions_plugins_visual_studio_copilot_refactoring';
MDX_extensions_plugins_extensions_plugins_visual_studio_copilot_refactoring.frontmatter = frontmatter;
