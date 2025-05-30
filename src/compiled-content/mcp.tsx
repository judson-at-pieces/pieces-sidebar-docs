import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Model Context Protocol (MCP)",
  "path": "/mcp",
  "visibility": "PUBLIC"
};

const markdownContent = `
# Model Context Protocol (MCP)

The Model Context Protocol (MCP) enables seamless integration between Pieces and your favorite AI-powered development tools.

## Available Guides

- **[Get Started](/docs/mcp/get-started)** - Learn the basics of MCP
- **[MCP Prompting](/docs/mcp/prompting)** - Master MCP prompting techniques
- **[MCP → Cursor](/docs/mcp/cursor)** - Connect MCP with Cursor
- **[MCP → GitHub Copilot](/docs/mcp/github-copilot)** - Connect MCP with GitHub Copilot
- **[MCP → Goose](/docs/mcp/goose)** - Connect MCP with Goose

Choose a guide above to get started with MCP!`;

export default function MDX_mcp() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_mcp.displayName = 'MDX_mcp';
MDX_mcp.frontmatter = frontmatter;
