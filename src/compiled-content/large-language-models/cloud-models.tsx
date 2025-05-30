import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Cloud Models",
  "path": "/large-language-models/cloud-models",
  "visibility": "PUBLIC"
};

const markdownContent = `<pieces-cloud-models />
`;

export default function MDX_large_language_models_cloud_models() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_large_language_models_cloud_models.displayName = 'MDX_large_language_models_cloud_models';
MDX_large_language_models_cloud_models.frontmatter = frontmatter;
