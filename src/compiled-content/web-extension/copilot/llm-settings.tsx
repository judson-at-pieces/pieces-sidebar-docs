import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Switching LLMs",
  "path": "/web-extension/copilot/llm-settings",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Available LLMs

We constantly update and configure our plugins and extensions, like the Pieces for Obsidian Plugin, to <a target="_blank" href="https://github.com/pieces-app/support/discussions/121">work with the latest LLMs</a>.

Click here to see all [54+ local and cloud-hosted models available](https://docs.pieces.app/products/large-language-models) for use with the Pieces for Obsidian Plugin.

## How To Configure Your LLM Runtime

Switching your LLM model in the Pieces Web Extension is

You can choose the model that best suits your needs, such as whether you need a model with a large context window for a specific task or series of prompts, or prefer speed over accuracy.

How to change your LLM:

<Steps>
  <Step title="Open the Copilot Chat View">
    Open the Copilot Chat view by clicking the \`Pieces Icon\` in the extensions section of your browser.
  </Step>

  <Step title="Locate the Active Model">
    Find the **Active Model** in the bottom-left corner of the view, where the current model (e.g., *GPT-4o Mini*) is shown.

    <Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/web_extension/pieces_copilot/llm_settings/changing_llm.png" alt="" align="center" fullwidth="true" />
  </Step>

  <Step title="View the Models">
    Click on \`Change Model\` to open the **Manage Copilot Runtime** modal.
  </Step>

  <Step title="Choose your Desired Model">
    Browse the list of local and cloud models, and select your preferred model.
  </Step>
</Steps>

Switching between the cloud and desktop icons allows you to browse and select from various available cloud and local models.

<Callout type="tip">
  Cloud-hosted models offer access to the latest AI capabilities, while on-device models ensure offline functionality, making Pieces Copilot adaptable to your specific workflow and environment.
</Callout>

Once you choose a new model, the switch is instant, allowing you to continue working smoothly with the latest model's features without restarting or refreshing anything.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/web_extension/pieces_copilot/llm_settings/changing_llm.gif" alt="" align="center" fullwidth="true" />
`;

export default function MDX_web_extension_copilot_llm_settings() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_web_extension_copilot_llm_settings.displayName = 'MDX_web_extension_copilot_llm_settings';
MDX_web_extension_copilot_llm_settings.frontmatter = frontmatter;
