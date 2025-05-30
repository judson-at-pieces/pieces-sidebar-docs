import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Updates & Upcoming",
  "path": "/desktop/navigation/updates",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## What’s New

The **Updates & Upcoming** page in Pieces for Developers provides a straightforward overview of recent releases and upcoming features.

You can check for new updates, preview future enhancements, and even share feedback or discuss features with the Pieces community—all in one place.

## Accessing Updates & Upcoming

You can open this page through the **Power Menu** by clicking the home icon next to the search bar in the Pieces for Developers Desktop App, then selecting \`Updates & Upcoming\` from the dropdown.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/navigation/updates_and_upcoming/updates_upcoming_modal.png" alt="" align="center" fullwidth="true" />

Alternatively, press \`shift+w\` (macOS/Windows/Linux) on your keyboard to jump there instantly.

## Overview of the Updates & Upcoming Page

This page is divided into two main sections.

At the top, you’ll find **Upcoming Features**, which highlight planned features or enhancements scheduled for future releases (since September 1, 2023).

Below that, you’ll see **Previous Releases**, which outlines all new additions, fixes, and improvements that have already been rolled out.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/navigation/updates_and_upcoming/updates_upcoming_overview.png" alt="" align="center" fullwidth="true" />

### Upcoming Features

The **Upcoming Features** section showcases everything on the horizon for Pieces, displaying each potential addition alongside a thumbs-up and thumbs-down button.

You can show your excitement or raise concerns for any feature, and a **Join the Discussion** button links directly to a GitHub discussion, where you can share ideas, provide suggestions, or raise any issues.
`;

export default function MDX_desktop_navigation_updates() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_navigation_updates.displayName = 'MDX_desktop_navigation_updates';
MDX_desktop_navigation_updates.frontmatter = frontmatter;
