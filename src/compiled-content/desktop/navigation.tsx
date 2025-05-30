import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Navigating the Pieces Desktop App",
  "path": "/desktop/navigation",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Power Menu

Navigation throughout the Pieces Desktop App is performed through the **Power Menu.**

There are two ways to open the **Power Menu**:

<Steps>
  <Step title="via Home Icon">
    Click the \`Home Icon\` to the left of the *Search Bar* to open up the **Power Menu.**

    <Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/extras/power_menu_from_home_button.gif" alt="" align="center" fullwidth="false" />
  </Step>

  <Step title="via Shortcuts">
    Use the following shortcuts to open the **Power Menu** depending on your operating system.

    | **macOS**   | **Windows**    | **Linux**      |
    | ----------- | -------------- | -------------- |
    | \`⌘+shift+p\` | \`ctrl+shift+p\` | \`ctrl+shift+p\` |
  </Step>
</Steps>

Interactive, labeled buttons in this menu let you jump to different views that correspond with different features and functionalities within the Pieces Desktop App.

## Views from the Power Menu

There are 7 views available within the **Power Menu** at any given point.

If you want more information, click the titles of the views below to read more specific documentation on them:

* [Pieces Copilot](https://docs.pieces.app/products/desktop/copilot) **/** [Pieces Drive](https://docs.pieces.app/products/desktop/drive)**:** Depending on which view you’re currently in, one of these buttons will display—or both, if in another view.

* [Settings](https://docs.pieces.app/products/desktop/navigation/settings)**:** The master settings window.

* [Captured Context](https://docs.pieces.app/products/desktop/navigation/captured-context)**:** View websites, anchors, people, annotations, and tags captured by LTM.

* [Updates & Upcoming](https://docs.pieces.app/products/desktop/navigation/updates)**:** View release notes for upcoming features and past releases.

* [Snippet Discovery](https://docs.pieces.app/products/desktop/navigation/snippet-discovery)**:** Let Pieces scan a local code repository for useful materials.

* [Workflow Activity](https://docs.pieces.app/products/desktop/navigation/workflow-activity)**:** See top materials, recent searches, and a timeline history of added or adjusted materials within the Pieces Drive.

* [Global Search](https://docs.pieces.app/products/desktop/navigation/global-search)**:** Search your Pieces Drive for specific saved materials.

### via Power Menu — Find Action

From within the Power Menu, there is a search bar titled *Find Action*.

From this menu, you can either click or scroll through some of the available options, like \`Manage General Copilot Settings\`, \`New General Copilot Conversation\`, or \`Refresh Selected Chat\`.

These actions, some of which are view-specific—like refreshing a selected Pieces Copilot Chat—are useful ways to navigate throughout the Pieces Desktop App while maintaining speed and efficiency in your workflow.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/navigation/navigation_main/gifs/find_actions_list_demo.gif" alt="" align="center" fullwidth="true" />

Included at the very end of the scrollable **Find Actions** list are links to other Pieces for Developers plugins and extensions, as well as social outlets (<a target="_blank" href="https://www.youtube.com/@getpieces">Pieces YouTube</a>, [Pieces Discord](https://discord.com/invite/getpieces), etc.) and two additional links for <a target="_blank" href="https://github.com/pieces-app/support/issues">reporting issues</a> or <a target="_blank" href="https://getpieces.typeform.com/to/mCjBSIjF?typeform-source=beta.docs.pieces.app#page=docs-support">contacting support.</a>

### via Power Menu — Settings

The **Settings** view is the only page from which the **Power Menu** cannot be accessed.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/NAVIGATION/all_settings.png" alt="" align="center" fullwidth="false" />

This view contains several different buckets of configurable options, such as [Account & Cloud](https://docs.pieces.app/products/desktop/configuration/account-and-cloud), [Pieces Copilot & Machine Learning](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning), [Aesthetics & Layouts](https://docs.pieces.app/products/desktop/configuration/aesthetics-layout), and [other settings](https://docs.pieces.app/products/desktop/configuration/additional-settings).

## Focus Mode

**Focus Mode** allows you to concentrate on your current task by minimizing distractions.

You can toggle Focus Mode by clicking the \`Focus Mode\` button located in the upper left of the Pieces Copilot or Pieces Drive view, near the sidebar.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/navigation/navigation_main/gifs/enter_focus_mode_from_chat.gif" alt="" align="center" fullwidth="true" />

When activated, it closes the sidebar, giving you an expanded view of your current Pieces Copilot conversation.

To exit **Focus Mode**, simply click the button again to restore the sidebar, or press \`esc\` (macOS/Windows/Linux).
`;

export default function MDX_desktop_navigation() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_navigation.displayName = 'MDX_desktop_navigation';
MDX_desktop_navigation.frontmatter = frontmatter;
