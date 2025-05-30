import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Pieces Web Extension Shortcuts",
  "path": "/web-extension/shortcuts",
  "visibility": "PUBLIC"
};

const markdownContent = `***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/web_extension/shortcuts/settings_PWE.png" alt="" align="center" fullwidth="true" />

***

## Shortcut Table

Several actions related to the Material Management ecosystem are accessible with shortcuts.

***

| **Command**                    | **macOS**   | **Windows/Linux** |
| ------------------------------ | ----------- | ----------------- |
| *Copy*                         | \`⌘+c\`       | \`ctrl+c\`          |
| *Paste*                        | \`⌘+v\`       | \`ctrl+v\`          |
| Save Selection to Pieces Drive | \`⌥+shift+s\` | \`alt+shift+s\`     |
| Open Quick Menu                | \`⌘+o\`       | \`ctl+o\`           |

***

<Callout type="tip">
  You can set shortcuts in the [settings](https://docs.pieces.app/products/web-extension/configuration) for the Pieces Web Extension.
</Callout>
`;

export default function MDX_web_extension_shortcuts() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_web_extension_shortcuts.displayName = 'MDX_web_extension_shortcuts';
MDX_web_extension_shortcuts.frontmatter = frontmatter;
