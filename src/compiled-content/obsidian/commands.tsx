import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Pieces for Obsidian Plugin Commands",
  "path": "/obsidian/commands",
  "visibility": "PUBLIC"
};

const markdownContent = `***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/obsidian_plugin_assets/commands/settings_page_OBS.png" alt="" align="center" fullwidth="true" />

***

## Shortcut Table

There are a number of actions related to the [Material Management ecosystem](https://docs.pieces.app/products/obsidian/copilot) that are accessible with shortcuts.

***

| **Command** | **macOS** | **Windows/Linux** |
| ----------- | --------- | ----------------- |
| *Copy*      | \`⌘+c\`     | \`ctrl+c\`          |
| *Paste*     | \`⌘+v\`     | \`ctrl+v\`          |

***

<Callout type="tip">
  You can set shortcuts in the [settings](https://docs.pieces.app/products/obsidian/configuration) for the Pieces for Obsidian Plugin.
</Callout>

## Command Table

You can access these commands through the **Command Palette** using the shortcuts—\`⌘+p\` (macOS) and \`ctrl+p\` (Windows/Linux).

Type \`Pieces for Developers:\` followed by the desired command to filter and locate it in the list.

***

| **Pieces for Developers: Save to Pieces**                   | Save the selected code snippet to your Pieces repository for easy access and future use. |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Pieces for Developers: Share via Pieces**                 | Share the selected code snippet with others by generating a shareable link.              |
| **Pieces for Developers: Switch Pieces Context**            | Switch between different Pieces contexts for more relevant suggestions or actions.       |
| **Pieces for Developers: Ask Copilot about your selection** | Ask the Pieces copilot for assistance or insights related to the selected code snippet.  |

***
`;

export default function MDX_obsidian_commands() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_obsidian_commands.displayName = 'MDX_obsidian_commands';
MDX_obsidian_commands.frontmatter = frontmatter;
