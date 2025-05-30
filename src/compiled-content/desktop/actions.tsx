import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Actions & Keyboard Shortcuts",
  "path": "/desktop/actions",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Overview

The Pieces Desktop App provides two primary ways to quickly perform *actions* and navigate around the app:

1. **Power Menu Actions**: A context-aware command palette that surfaces different options depending on the *view* you’re in (e.g., Pieces Drive or Pieces Copilot).

2. **Keyboard Shortcuts**: System or app-level keyboard shortcuts that let you instantly perform common tasks without opening any menus.

## Context-Aware Power Menu

When you open the **Power Menu**, the actions you see can change based on your current location in the app.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/actions_and_keyboard_shortcuts/actions_and_keyboard_shortcuts_MAIN/power_menu_actions_screenshot.png" alt="" align="center" fullwidth="true" />

Here are some examples:

* **Pieces Drive Actions**: Creating, editing, and organizing saved materials, etc.

* **Pieces Copilot Actions**: Generative AI-related features like analyzing or refactoring code, starting new chats, etc.

* **Global/App Actions**: Account management, backup and restore, settings, etc.

Because these commands depend on the active *View*, you’ll *only see and be able to search for* relevant options in that moment.

### When to Use the Power Menu

There are plenty of use cases for using the **Power Menu**—here are a couple:

* **Discoverability**: If you’re unsure which action you need or want to browse available commands, simply open the menu and type a keyword.

* **Context-Specific Actions**: The Power Menu dynamically shows commands that make sense in your current view (e.g., Pieces Drive vs. Copilot).

## Keyboard Shortcuts

For a detailed list of all possible shortcuts and their descriptions, visit the [Keyboard Shortcuts](https://docs.pieces.app/products/desktop/actions/keyboard-shortcuts) page for multi-platform shortcut tables and action titles.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/actions_and_keyboard_shortcuts/actions_and_keyboard_shortcuts_MAIN/power_menu_actions_screenshot.png" alt="" align="center" fullwidth="true" />

### When to Use Shortcuts

Shortcuts are a time-tested and often-preferred method of accomplishing individual tasks or processes for developers, creatives, and knowledge-workers alike.

Here are some examples:

* **Speed & Muscle Memory**: If you already know a shortcut (like ⌘+S to save), it’s the fastest way to perform routine tasks.

* **Consistent, Regardless of View**: Many shortcuts (e.g., toggling edit mode or saving a snippet) work across multiple views, even though some may be view-specific.

## Actions vs Shortcuts

The Pieces Desktop App provides the best of both worlds—a wealth of actions accessible from the **Power Menu** and plenty of keyboard shortcuts to boot.

<Callout type="tip">
  Try to familiarize yourself with both **Power Menu** actions and **Keyboard Shortcuts** to see which better fit your workflow.
</Callout>

You might want to try getting familiar with both, and here are two reasons why:

* **Invocation**: Shortcuts are **pressed**, while Power Menu commands are **typed** and then selected.

- **Scope**: Shortcuts typically work globally or in a specific view, while Power Menu commands are always **context-aware** and only appear if they’re relevant to the current workspace.
`;

export default function MDX_desktop_actions() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_actions.displayName = 'MDX_desktop_actions';
MDX_desktop_actions.frontmatter = frontmatter;
