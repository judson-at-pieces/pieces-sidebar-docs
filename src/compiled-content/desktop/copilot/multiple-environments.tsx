import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Pieces Copilot in Other Environments",
  "path": "/desktop/copilot/multiple-environments",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Using Pieces Copilot in IDEs

Pieces is integrated into several of the most popular IDEs, code editors, and productivity tools, so you can use Pieces however you like—no drawbacks.

## Cross-Environment Access

Pieces for Developers has launched several plugins and extensions for popular code editors and IDEs, such as Visual Studio Code and JetBrains, and productivity tools, like Obsidian.

In these plugins and extensions, you can also access Pieces Drive and PiecesOS-enabled LTM context alongside Pieces Copilot, giving you the full set of tools to use.

### Plugins & Extensions

Click the links below to view up-to-date or upcoming documentation for all Pieces for Developers products, including plugins and extensions.

***

| **Plugin**                                                                                 | **Extension**                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [JetBrains](https://docs.pieces.app/products/extensions-plugins/jetbrains)                 | [Visual Studio](https://docs.pieces.app/products/extensions-plugins/visual-studio)           |
| [Sublime Text](https://docs.pieces.app/products/extensions-plugins/sublime)                | [Visual Studio Code](https://docs.pieces.app/products/extensions-plugins/visual-studio-code) |
| [Azure Data Studio](https://docs.pieces.app/products/extensions-plugins/azure-data-studio) | [Web Extension](https://docs.pieces.app/products/web-extension)                              |
| <a target="_blank" href="https://pieces.app/plugins/neovim">Neovim</a>                     | [JupyterLab](https://docs.pieces.app/products/extensions-plugins/jupyterlab)                 |

***

Additionally, find documentation here for our other productivity & collaboration tools:

* [Pieces CLI](https://docs.pieces.app/products/extensions-plugins/cli)

* [RayCast](https://docs.pieces.app/products/raycast)

* [Obsidian](https://docs.pieces.app/products/obsidian)

## Integration with Other Applications

Pieces Copilot is integrated into several IDEs through dedicated plugins and extensions.

When you use Pieces Copilot within an IDE, you experience a similar chat interface with environments using the Pieces Applet view, complete with context-aware suggestions tailored to your current project.

The settings and configurations (such as LTM context and model preferences) remain consistent with the Desktop App, ensuring a seamless transition between environments.

### Shared Conversation Threads

The Copilot experience supports *cross-threading.*

This means that your chat history and contextual data can be shared between the Desktop App and other environments.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_in_multiple_environments/copilot_in_environment_demo_part_one.png" alt="" align="center" fullwidth="true" />

Whether you start a conversation in the Desktop App and later continue it in an IDE, your context and settings persist—making for a fluid, uninterrupted workflow.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_in_multiple_environments/copilot_in_environment_demo_part_two.png" alt="" align="center" fullwidth="true" />

## The Pieces User Experience

Pieces Copilot is designed to maintain a consistent core experience—offering essential features like chat history, context management, and LLM configuration—across all environments.

### Flutter-Supported Environments

In platforms such as JetBrains, Visual Studio Code, and the Pieces Web Extension, Pieces leverages a dedicated Flutter-based *Applet* view which provides a standardized user experience for interacting with Pieces Copilot and the Pieces Drive.

***

*Pieces Web Extension*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_in_multiple_environments/pieces_web_extension_copilot_applet.png" alt="" align="center" fullwidth="true" />

***

### Custom UI Environments

For environments that do not support Flutter applets (e.g., Sublime Text or the CLI), Pieces Copilot adapts with a custom interface tailored to the specific platform.

Although the visual presentation differs, all core features remain available, so the learning curve is as minimal as possible while still providing Pieces functionalities.

***

*Pieces for Sublime Text Plugin*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_in_multiple_environments/pieces_copilot_sublime_text.png" alt="" align="center" fullwidth="true" />

***
`;

export default function MDX_desktop_copilot_multiple_environments() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_copilot_multiple_environments.displayName = 'MDX_desktop_copilot_multiple_environments';
MDX_desktop_copilot_multiple_environments.frontmatter = frontmatter;
