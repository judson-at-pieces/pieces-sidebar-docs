import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Model Context Protocol (MCP) Servers",
  "path": "/desktop/configuration/mcp",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Accessing MCP Settings

To access the MCP configuration screen, click the **Settings** gear icon located in the bottom-left corner of the Pieces Desktop App’s main view.

From there, navigate to **Model Context Protocol (MCP)**.

Inside this tab, you can view the server URL, check the MCP server version, and quickly access MCP documentation.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/configuration/mcp/model_context_protocol_pfd_settings.png" alt="" align="center" fullwidth="false" />

### MCP Server URLs

In the MCP Settings, you'll find the **Server URLs** section.

This URL is what your development tools or AI applications, such as [Cursor](https://docs.pieces.app/products/mcp/cursor) or [GitHub Copilot](https://docs.pieces.app/products/mcp/github-copilot), will use to communicate directly with your local PiecesOS MCP server.

You can copy this URL by clicking the *copy* icon next to the URL text box and use it to configure integrations in compatible IDEs and code editors.

### MCP Server Version

The version displayed under the server URL indicates the currently running MCP protocol version.

Ensure your [tools and integrations](https://docs.pieces.app/products/mcp/get-started#getting-started) are compatible with this version to maintain smooth communication.

### View MCP Documentation

Click \`View Documentation\` to access detailed guides that explain how to leverage MCP integrations with popular development environments, such as Cursor and GitHub Copilot.

This documentation covers setup instructions, example scenarios, and troubleshooting tips for efficient MCP usage.

Here are quick examples of how MCP enhances your coding and debugging experiences:

* **Context-Rich Debugging**: Instantly retrieve logs, historical debugging notes, or team discussions directly from PiecesOS when troubleshooting within Cursor.

* **Contextual Queries**: Access historical code implementations, error resolutions, or previously encountered bugs within GitHub Copilot for quicker coding solutions.

For more use cases, refer to this [MCP documentation.](https://docs.pieces.app/products/mcp/get-started)

***

*Pieces MCP → Cursor*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/misc/cursor_ask_about_youtube_tutorial.png" alt="" align="center" fullwidth="false" />

***
`;

export default function MDX_desktop_configuration_mcp() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_configuration_mcp.displayName = 'MDX_desktop_configuration_mcp';
MDX_desktop_configuration_mcp.frontmatter = frontmatter;
