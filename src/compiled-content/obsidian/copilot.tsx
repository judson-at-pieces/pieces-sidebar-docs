import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Pieces Copilot",
  "path": "/obsidian/copilot",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Generative AI Conversations

Facing an issue or not sure how to tackle a challenge? You can [ask the Pieces Copilot specific questions](https://docs.pieces.app/products/obsidian/copilot/chat) directly in Obsidian using the Copilot Chat side window.

You can ask questions that don't need context, like *“What is the basic format for a JSON object?”* or more detailed questions where the Pieces Copilot requires context from your active note.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/obsidian_plugin_assets/pieces_copilot/MAIN_pieces_copilot/chat_example_question_OBS.png" alt="" align="center" fullwidth="true" />

## Adding Conversation Context

Contextual awareness lets the Pieces Copilot help you solve problems faster by providing answers that are relevant to the issue you're facing and your notes.

To use this feature, include details like error messages or [file context](https://docs.pieces.app/products/obsidian/copilot#adding-conversation-context) for more accurate responses from the LLM conversation.

You can also add multiple files and other items as context to your question, giving the Pieces Copilot comprehensive information to help you troubleshoot.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/obsidian_plugin_assets/pieces_copilot/MAIN_pieces_copilot/add_context_menu_open_OBS.png" alt="" align="center" fullwidth="true" />

Start by right-clicking a selection and selecting the following option from the tool menu:

* \`Ask Copilot About Your Selection\`: Includes the active selection in the conversation.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/obsidian_plugin_assets/pieces_copilot/MAIN_pieces_copilot/right_context_ask_copilot_OBS.png" alt="" align="center" fullwidth="true" />

## Selecting Your Pieces Copilot Runtime

Choose between [different LLMs directly within the Obsidian Editor](https://docs.pieces.app/products/obsidian/copilot/llm-settings) by accessing the sidebar and selecting your preferred model by clicking the currently utilized LLM under \`Active Model\` (GPT-4o Mini).

Options range from lightweight models for simple queries to advanced models for in-depth analysis, as well as **local** and **cloud-based LLMs.**

This flexibility allows you to tailor Pieces Copilot to your specific development needs, whether speed or accuracy.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/obsidian_plugin_assets/pieces_copilot/MAIN_pieces_copilot/change_llm_option_OBS.png" alt="" align="center" fullwidth="true" />

Read more about [what LLMs are available ](https://docs.pieces.app/products/obsidian/configuration#supported-llms)with the Pieces for Obsidian Plugin.

## Pieces Copilot As a Daily Driver

The Pieces Copilot is a powerful, adaptable tool that grows with you as you use it—*so use it!*

***

<AccordionGroup>
  <Accordion title="Collaborative Coding Made Easy">
    Generate detailed comments and documentation for better team collaboration and to reduce onboarding times. This will create a unified coding and writing style across teams.
  </Accordion>

  <Accordion title="Troubleshoot and Resolve Bugs Swiftly">
    Use the Pieces Copilot in Obsidian to streamline the bug-fixing process. Its contextual understanding and suggested solutions make writing faster, keeping your project on course.
  </Accordion>

  <Accordion title="Quick Prototyping">
    Generate initial implementations and boilerplate code for prototypes and fast-paced projects. Ideal for hackathons, PoCs, and other time-sensitive tasks.
  </Accordion>

  <Accordion title="Skill Enhancement">
    Pieces Copilot doubles as a learning tool, helping you explore best practices, new paradigms, and advanced techniques in real-time.
  </Accordion>

  <Accordion title="Efficient Code Refactoring">
    Optimize your vault through intelligent refactoring recommendations. The Pieces Copilot analyzes your note patterns, suggests structural improvements, and delivers optimizations for both performance and readability.
  </Accordion>
</AccordionGroup>

***

<a target="_blank" href="https://obsidian.md/plugins?search=pieces-for-developers">Download the Pieces for Obsidian Plugin today!</a>
`;

export default function MDX_obsidian_copilot() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_obsidian_copilot.displayName = 'MDX_obsidian_copilot';
MDX_obsidian_copilot.frontmatter = frontmatter;
