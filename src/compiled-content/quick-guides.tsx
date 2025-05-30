import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Quick Guides",
  "path": "/quick-guides",
  "visibility": "PUBLIC"
};

const markdownContent = `
# Quick Guides

Welcome to the Pieces Quick Guides! These guides will help you get up and running quickly with key features of Pieces.

## Available Guides

- **[Overview](/docs/quick-guides/overview)** - Get started with quick guides
- **[Using Long-Term Memory Context](/docs/quick-guides/ltm-context)** - Learn how to leverage LTM-2
- **[Using Pieces Copilot with Context](/docs/quick-guides/copilot-with-context)** - Maximize your AI assistant
- **[Long-Term Memory Prompting Guide](/docs/quick-guides/ltm-prompting)** - Master prompting techniques

Choose a guide above to get started!`;

export default function MDX_quick_guides() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_quick_guides.displayName = 'MDX_quick_guides';
MDX_quick_guides.frontmatter = frontmatter;
