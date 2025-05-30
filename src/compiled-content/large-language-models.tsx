import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Pieces for Developers | LLMs",
  "path": "/large-language-models",
  "visibility": "PUBLIC"
};

const markdownContent = `***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/standalone_single_docs/compatible_llms/compatible-llms.png" alt="" align="center" fullwidth="true" />

***

## Compatible AI Models with Pieces

Pieces utilizes cloud-hosted LLMs from providers like OpenAI, Anthropic, and Google. All local models are served through [Ollama, a core dependency of PiecesOS](https://docs.pieces.app/products/core-dependencies/ollama) and the rest of the Pieces Suite.

## Cloud-Only LLMs | Providers

[Browse the list of cloud-hosted AI models available for use](https://docs.pieces.app/products/large-language-models/cloud-models) with the Pieces Desktop App and several of our plugins and extensions.

***

| **Provider** | **Model Name**                 |
| ------------ | ------------------------------ |
| *OpenAI*     | GPT-X                          |
| *Anthropic*  | Claude / Sonnet / Opus / Haiku |
| *Google*     | Gemini / Pro / Flash / Chat    |

***

## Local-Only LLMs | Providers

Read [through the list of local AI models available for use](https://docs.pieces.app/products/large-language-models/local-models) within the Pieces Desktop App and the rest of the Pieces Suite.

***

| **Provider** | **Model Name**               |
| ------------ | ---------------------------- |
| *Google*     | Gemma / Code Gemma           |
| *IBM*        | Granite / Code / Dense / MoE |
| *Meta*       | LLaMA / CodeLLaMA            |
| *Mistral*    | Mistral / Mixtral            |
| *Microsoft*  | Phi                          |
| *Qwen*       | QwQ / Coder                  |
| *StarCoder*  | StarCoder                    |

***

### Using Ollama with Pieces

Ollama is *required* to utilize local generative AI features.

It’s a lightweight system that allows for a plug-and-play experience with local models, meaning that Pieces can update the number of compatible models we serve at lightning-speeds!

If you want to read more about installing and using Ollama with Pieces, [click here for the Ollama section of our Core Dependencies documentation.](https://docs.pieces.app/products/core-dependencies/ollama)
`;

export default function MDX_large_language_models() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_large_language_models.displayName = 'MDX_large_language_models';
MDX_large_language_models.frontmatter = frontmatter;
