import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Local Models",
  "path": "/large-language-models/local-models",
  "visibility": "PUBLIC"
};

const markdownContent = `<pieces-local-models />
`;

export default function MDX_large_language_models_local_models() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_large_language_models_local_models.displayName = 'MDX_large_language_models_local_models';
MDX_large_language_models_local_models.frontmatter = frontmatter;
