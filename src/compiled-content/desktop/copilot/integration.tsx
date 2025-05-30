import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Integrating Context & Projects",
  "path": "/desktop/copilot/integration",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Using Context with Pieces Copilot

Adding context to Pieces Copilot chats makes responses significantly more relevant and useful—especially when that context is pulled directly from your workflow.

<Card title="Want to learn more about using LTM Context?" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1743103872340/1b9ffce3-f465-4c7e-afd8-5e98d2a8fba5.png">
  Read this [LLM Prompting Guide](https://docs.pieces.app/products/quick-guides/ltm-prompting/tips) or learn how to use [Pieces Copilot with LTM Context](https://docs.pieces.app/products/quick-guides/copilot-with-context) via these helpful Quick Guides.
</Card>

## Enriching Chats with LTM-2 Context

Integrating context ensures Pieces Copilot isn’t answering in a vacuum.

By including Long-Term Memory data and project-specific resources, you can improve the accuracy of generative AI responses, reduce context-switching, work more effectively.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/context_and_project_integration/enriching_chats_with_context_closeup.png" alt="" align="center" fullwidth="true" />

### LTM Context Toggle

Below the *Set Context* section of the main Pieces Copilot view, you have the option to enable LTM Context.

When turned on, your long-term memory data—captured by PiecesOS from your previous workflow—is automatically injected into every new chat.

This means that even if you start a fresh conversation, Pieces Copilot has access to important context from earlier sessions.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/context_and_project_integration/gifs/enabling_context_in_new_chat.gif" alt="" align="center" fullwidth="true" />

### Adding Folders

Click the \`Folders\` button in the *Set Context* area.

This opens the **Manage Copilot Context** modal, where you can add local code directories.

To do so, click \`Add Folders\` to open your Finder (macOS) or File Explorer (Windows/Linux).

Select the directories that you want the Pieces Copilot to use as context. This is especially useful when working on large projects where entire folders contain valuable code references.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/context_and_project_integration/gifs/adding_folder_as_directory_context.gif" alt="" align="center" fullwidth="true" />

### Adding Files

Similarly, clicking the \`Files\` button opens the same modal so you can select individual files from anywhere on your device.

Click \`Add Files\` to select specific code files.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/context_and_project_integration/gifs/adding_several_files_as_context%20%20.gif" alt="" align="center" fullwidth="true" />

These files are then parsed by Pieces Copilot to provide precise answers related to your code.

### Adding Websites

If you need to reference external code on a website—like on Stack Overflow—click the \`Add Websites\` option, which is accessible via the [Quick Action menu.](https://docs.pieces.app/products/desktop/drive/enrichment-and-metadata#using-the-quick-menu)

This opens a modal where you can enter a website URL.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/context_and_project_integration/gifs/adding_websites_as_context_demo.gif" alt="" align="center" fullwidth="true" />

Websites with code snippets or technical documentation can then be used as contextual material for your Pieces Copilot queries.

## Enriching Chats with Saved Materials

You can also add saved materials from the [Pieces Drive](https://docs.pieces.app/products/desktop/drive) into your Pieces Copilot Chat as context for the conversation.

### Selecting Saved Materials

Clicking the \`Saved Materials\` button opens up an interface that displays a clickable list of code snippets and documents previously saved in Pieces Drive.

Choose the relevant saved material that you’d like to include in your current conversation.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/context_and_project_integration/gifs/selecting_saved_materials_add_as_context.gif" alt="" align="center" fullwidth="true" />

This ensures that the Pieces Copilot is aware of your pre-curated, AI-enriched materials and can reference them in its responses.
`;

export default function MDX_desktop_copilot_integration() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_copilot_integration.displayName = 'MDX_desktop_copilot_integration';
MDX_desktop_copilot_integration.frontmatter = frontmatter;
