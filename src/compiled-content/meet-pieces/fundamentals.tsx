import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Core Features of Pieces",
  "path": "/meet-pieces/fundamentals",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## The Pillars

Pieces powers developers to new levels of productivity by introducing the **\\[1] Long-Term Memory Engine (LTM-2)**, a powerful “artificial memory” that remembers your workflow and automatically saves context for future use.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/fundamentals/ltm-2-header.png" alt="" align="center" fullwidth="true" />

Next, Pieces offers the **\\[2] Pieces Copilot**, assisting with day-to-day tasks like debugging code, generating comments, and answering questions—with as much or as little workflow context as you need.

Finally, Pieces provides the **\\[3] Pieces Drive**, an intelligent and enriched material management experience that ensures your most important code—and other useful materials—are always at hand.

## LTM-2

The Long-Term Memory Engine (LTM-2) captures live context from your workflow over a 7-day period, enhancing your ability to recall and access past materials.

***

*Pieces Copilot with LTM-2 Context*

<Image src="https://cdn.hashnode.com/res/hashnode/image/upload/v1734028488469/d128a760-7e91-4dbf-8cfc-e7fc257488b7.png" alt="" align="left" fullwidth="true" />

***

You can ask questions like, “*Can you provide me with the link to the Firestore database I was working in last week?”* or “*Summarize the contents of the brief on plugin updates in the Google doc Tim shared”* for game-changing productivity enhancement.

Here are some ways to take advantage of the LTM-2:

* \`Contextual Recall\`: LTM-2 remembers the websites you visit, the code you work on, and the snippets you save. This context can be accessed via the Pieces Desktop App or within Copilot Chats inside your favorite IDE—with the relevant Pieces extension or plugin installed.

* \`Natural Language Queries\`: Ask contextual questions about your previous workflow, and LTM-2 will source the relevant anchor and provide you with a clickable URL or path to a file on your device—or try asking it to summarize the contents of a webpage you visited earlier in the day.

* \`Integrated Access\`: Utilize LTM-2 through the Pieces Desktop App or within your favorite development tools via browser or IDE integrations.

### Workstream Activity

Pieces for Developers has just launched a new flagship feature called [Workstream Activity](https://docs.pieces.app/products/desktop/workstream-activity).

The Workstream Activity view in the [Pieces Desktop App](https://docs.pieces.app/products/desktop) uses the advanced Long-Term Memory (LTM-2) Engine to collect and summarize your recent tasks, discussions, code reviews, and more.

***

*Workstream Activity in the Pieces Desktop App*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/workstream_activity/new_workstream_activity_media/ltm_rollup_demo_screenshot.png" alt="" align="center" fullwidth="true" />

***

[PiecesOS](https://docs.pieces.app/products/core-dependencies/pieces-os) collects the LTM data and provides a concise roll-up of that data *every 20 minutes,* drastically reducing the repetitive context-setting typical of many AI tools.

Each roll-up is a snapshot that includes details on main tasks, projects, issues resolved, key decisions, discussions, documents, and code you’ve reviewed—often with helpful links included!

You can also start Pieces Copilot chats with individual roll-ups, eliminating the need to manually enter context.

## Pieces Copilot

Pieces Copilot leverages advanced Large Language Models (LLMs) to assist you in understanding and generating code, accessible through your IDEs, editors, and the Desktop App.

***

*Pieces Copilot for Code Generation*

<Image src="https://cdn.hashnode.com/res/hashnode/image/upload/v1734028533289/f37f7075-f2d2-4a99-b948-c23fd70e7257.png" alt="" align="middle" fullwidth="true" />

***

The Pieces Copilot, accessible via the Pieces Desktop App or any of our IDE or browser integrations, helps with:

* \`Understanding Code\`: Get explanations of complex code snippets, learn how a particular function works, or explore alternative implementations.

* \`Code Generation\`: Generate code or code comments based on specific requirements, either from raw prompting or in-environment contextual understanding.

* \`LLM Flexibility\`: Switch between local models for privacy and speed, or cloud-hosted models for more advanced capabilities.

## Pieces Drive

Saving and managing code and other materials is effortless and efficient with Pieces Drive.

***

*Viewing Saved Materials with Pieces Drive*

<Image src="https://cdn.hashnode.com/res/hashnode/image/upload/v1734026181487/e947ec50-4346-49f1-a967-62b218aafc47.png" alt="" align="center" fullwidth="true" />

***

The Pieces Drive lets you save important developer resources, like notes, useful code, links, and more to your personal Local Repository—from which you can then view, edit, re-use, and share these materials via Pieces Shareable Links.

Intended recipients are not required to have a Pieces account, so cross-platform collaboration is exceptionally easy.

With Pieces, you’ll find Pieces Drive integrated into your favorite:

* \`IDEs and Editors\`: Extensions for [VS Code](https://docs.pieces.app/products/extensions-plugins/visual-studio-code), [JetBrains IDEs](https://docs.pieces.app/products/extensions-plugins/jetbrains), [Sublime Text](https://docs.pieces.app/products/extensions-plugins/sublime), and more enable you to save snippets without leaving your coding environment.

* \`Web Browsers\`: The Pieces Web Extension let you capture code from documentation sites, forums, or any web page using your favorite browsers.

* \`Collaboration Tools\`: Integrations with tools like [Obsidian](https://docs.pieces.app/products/obsidian) help you save code from notes and shared documents.
`;

export default function MDX_meet_pieces_fundamentals() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_meet_pieces_fundamentals.displayName = 'MDX_meet_pieces_fundamentals';
MDX_meet_pieces_fundamentals.frontmatter = frontmatter;
