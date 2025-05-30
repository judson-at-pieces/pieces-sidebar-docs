import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Introduction to Pieces Copilot",
  "path": "/desktop/copilot",
  "visibility": "PUBLIC"
};

const markdownContent = `***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pfd_docs_figmas/pieces_copilot.png" alt="" align="center" fullwidth="true" />

***

## Overview

Pieces Copilot enables you to interact with advanced generative AI (both cloud-hosted and on-device), engage in technical chats, generate and debug code, and access your workflow context effortlessly.

It’s designed for *developers, designers, knowledge workers,* and *enterprise teams* alike.

On this page, you’ll find a brief overview of the key capabilities of Pieces Copilot.

For more in-depth guidance, please explore our dedicated subpages:

* [Interacting with Pieces Copilot](https://docs.pieces.app/products/desktop/copilot/interaction): Learn how to start a conversation, leverage suggested prompts, and utilize quick-action tools.

- [Context & Project Integration](https://docs.pieces.app/products/desktop/copilot/integration): Discover how to enrich your chats by providing context from your local files, folders, saved materials, and websites. You can also view this guide for [more information on using Pieces Copilot with LTM Context.](https://docs.pieces.app/products/quick-guides/copilot-with-context)

* [Configuring Pieces Copilot](https://docs.pieces.app/products/desktop/copilot/configuration): Understand how to manage your LLM runtime, choose between cloud and on-device models, and customize settings to fit your workflow.

- [Pieces Copilot in Multiple Environments](https://docs.pieces.app/products/desktop/copilot/multiple-environments): Find out how the Copilot experience extends to different IDEs and external integrations.

## Pieces Copilot | Main View

When you launch the Pieces for Developers Desktop App, you are greeted by the **Pieces Copilot View**—a dynamic, context-rich chat interface designed to help you interact with powerful generative AI, manage your project context, and streamline your coding workflow.

Inside the Pieces Copilot view, you can:

1. Interact with advanced [local and cloud-hosted LLMs](https://docs.pieces.app/products/desktop/copilot/interaction) for multi-purpose generative AI needs.

2. Leverage [Long-Term Memory (LTM-2) context captured by PiecesOS](https://docs.pieces.app/products/desktop/copilot/integration) to enhance AI responses.

3. Attach and manage folders, files, saved materials, and websites as [chat context.](https://docs.pieces.app/products/desktop/copilot/integration#adding-folders)

4. Search and [add saved code snippets as additional context](https://docs.pieces.app/products/desktop/copilot/integration#enriching-chats-with-saved-materials) to Pieces Copilot chats.

### Interacting with Pieces Copilot

We’ll walk you through the main Copilot Chat window and touch on all of the main elements you can interact with here.

You’ll learn how to interact with Pieces Copilot, utilize flexible *Suggested Prompts* when starting new chats, enable or disable Long-Term Memory context, add individual items to the chat, and discover other productivity-centric *Quick Actions.*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_MAIN/gifs/nteracting_with_pieces_copilot_parent_page.gif" alt="" align="center" fullwidth="true" />

### Context & Project Integration

One of Pieces Copilot’s key advantages is context awareness.

By integrating local folders, files, and your saved code snippets, you can significantly boost the relevance and accuracy of the Pieces Copilot’s AI responses.

In this section, we'll cover context and project management—adding items from Pieces Drive or your device as chat context, offering real-world examples to reduce context switching, and showing how to adjust the AI's understanding of your environment or workflow.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_MAIN/gifs/context_and_project_integration_parent_page_gif.gif" alt="" align="center" fullwidth="true" />

### Configuring Pieces Copilot

Pieces Copilot offers flexibility in choosing the AI model (cloud-based or local) and customizing the chat appearance and default context usage.

Discover the array of 40+ cloud-hosted and local models, served through Ollama or other providers, learn how to adjust your runtime, customize the appearance of your Pieces Copilot Chat view, enable or disable LTM context for new chats, and more.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_MAIN/configuring_pieces_copilot_parent_page.png" alt="" align="center" fullwidth="true" />

### Pieces Copilot in Multiple Environments

If you don't want the wide range of tools designed to boost your productivity and reduce context switching in your workflow with the Pieces Desktop App—that’s fine.

You can still find Pieces for Developers plugins & extensions available in your favorite collaboration tools, text editors, and most importantly, IDEs.

We’ll go over cross-platform consistency with context, history, and usage synchronization through PiecesOS, cross-threaded use case scenarios, link you to other Pieces software, and more.

***

*Pieces Copilot in JetBrains IDEs*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_copilot/pieces_copilot_MAIN/pieces_copilot_in_multiple_environments_parent_page.png" alt="" align="center" fullwidth="true" />

***

## Get Started with Pieces

Click one of the links below to be redirected to your platform-specific (OS) download and installation pages:

* [macOS](https://docs.pieces.app/products/meet-pieces/macos-installation-guide)

* [Windows](https://docs.pieces.app/products/meet-pieces/windows-installation-guide)

* [Linux](https://docs.pieces.app/products/meet-pieces/linux-installation-guide)
`;

export default function MDX_desktop_copilot() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_copilot.displayName = 'MDX_desktop_copilot';
MDX_desktop_copilot.frontmatter = frontmatter;
