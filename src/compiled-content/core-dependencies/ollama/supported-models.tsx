import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Pieces-Compatible Local LLMs",
  "path": "/core-dependencies/ollama/supported-models",
  "visibility": "PUBLIC"
};

const markdownContent = `<pieces-local-models />
`;

export default function MDX_core_dependencies_ollama_supported_models() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_core_dependencies_ollama_supported_models.displayName = 'MDX_core_dependencies_ollama_supported_models';
MDX_core_dependencies_ollama_supported_models.frontmatter = frontmatter;
