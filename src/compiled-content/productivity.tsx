import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Productivity Tools",
  "path": "/productivity",
  "visibility": "PUBLIC"
};

const markdownContent = `
# Productivity Tools

Enhance your productivity with Pieces across various tools and platforms.

## Available Tools

- **[Obsidian](/docs/obsidian)** - Knowledge management integration
- **[Web Extension](/docs/web-extension)** - Browser extension for Chrome, Firefox, and Edge
- **[Pieces CLI](/docs/cli)** - Command-line interface for power users
- **[Raycast](/docs/raycast)** - macOS productivity app integration

Choose a tool above to get started!`;

export default function MDX_productivity() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_productivity.displayName = 'MDX_productivity';
MDX_productivity.frontmatter = frontmatter;
