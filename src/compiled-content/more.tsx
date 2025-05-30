import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "More",
  "path": "/more",
  "visibility": "PUBLIC"
};

const markdownContent = `
# More Resources

Additional resources and information about Pieces.

## Available Resources

- **[Privacy, Security & Your Data](/docs/privacy-security-your-data)** - Learn about our security practices
- **[Glossary](/docs/glossary)** - Key terms and concepts

Choose a resource above to learn more!`;

export default function MDX_more() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_more.displayName = 'MDX_more';
MDX_more.frontmatter = frontmatter;
