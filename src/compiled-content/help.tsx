import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Get Help",
  "path": "/help",
  "visibility": "PUBLIC"
};

const markdownContent = `
# Get Help

Need assistance? We're here to help!

## Support Resources

- **[Support](/docs/support)** - Contact our support team and find helpful resources

Visit our support page for assistance with any issues or questions you may have.`;

export default function MDX_help() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_help.displayName = 'MDX_help';
MDX_help.frontmatter = frontmatter;
