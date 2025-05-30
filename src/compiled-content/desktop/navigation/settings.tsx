import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Settings",
  "path": "/desktop/navigation/settings",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Overview

The \`Settings\` page in Pieces for Developers contains all configurable options, adjustable preferences, and modifiable behaviors for the Desktop Application.

You can customize the Pieces Desktop App to your coding workflow by integrating external services or customizing the interface.

## Accessing Settings

To access settings, press \`⌘+,\` (macOS) or \`ctrl+,\` (Windows/Linux).

You can also open the **Power Menu**, type ‘settings’ in the search field, and select \`Go To Settings\` from the dropdown menu.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/all_settings.png" alt="" align="center" fullwidth="false" />

## Understanding the Settings Layout

When you open **Settings**, you’ll find several configuration categories on the left side and an \`All\` tab at the top.

Click any category to reveal its associated options in the main panel.

* \`Categories\`: Organized for quick navigation.

* \`All\`**:** Displays every setting in one place.

You can review each section individually or see everything at once by selecting \`All\`**.**

### Account & Integrations

In this section, you can integrate external services with Pieces and adjust your user details, beginning with [Account Information.](https://docs.pieces.app/products/desktop/configuration/account-and-cloud#account-management)

This area displays your email address and any linked accounts.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/account_and_cloud.png" alt="" align="center" fullwidth="false" />

If you’re interested in testing upcoming features, the **Early Access Program** lets you join beta releases and stay ahead of the curve.

### Personal Cloud

The [Personal Cloud](https://docs.pieces.app/products/desktop/configuration/account-and-cloud#disconnecting-personal-cloud) tab controls how your snippets and materials sync across devices.

You’ll see a status for your cloud connection (including the last sync time), plus options to set or modify your personal domain.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/personal_cloud.png" alt="" align="center" fullwidth="false" />

There’s also a \`Backup & Restore Data\` feature to preserve or retrieve your snippets from the cloud whenever needed.

* \`Status\`: Check if your cloud is connected and see when it last synced.

* \`Domain\`: Update your personal domain.

* \`Backup & Restore Data\`: Protect your snippets and data.

### Copilot Chats

Within [Pieces Copilot Chats](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning#copilot-chats), decide which LLM runtime powers the Pieces Copilot and manage your chat-specific settings.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/copilot_chats.png" alt="" align="center" fullwidth="false" />

You can [Manage Copilot LLM Runtime](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning#manage-llm-runtime) or [Hard-Reset Active Runtime](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning#reset-active-runtime) if it becomes unresponsive. You can also pick an accent color for the chat UI, and \`Delete All Copilot Chats\` to clear your chat history.

* \`Manage Copilot LLM Runtime\`: Switch or reset your current LLM.

* \`Hard-Reset Active Runtime\`: Restart the runtime if it’s unresponsive.

* \`Delete All Copilot Chats\`: Remove your entire chat history.

### Machine Learning

Pieces uses an on-device ML engine (with optional cloud capabilities) to enrich and tag your snippets.

Inside the [Machine Learning](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning#machine-learning) tab, you can toggle \`Auto-Generated Tags\`, \`Auto-Generated Websites\`, \`Auto-Generated Hints\`, and \`Auto-Generated People\`.

Adjust the *Enrichment Level* (0 to 9) or choose an *Enrichment Mode* (local, cloud, or blended). The LTM captures historical data for additional context—if needed, you can clear it to start fresh.

* \`Auto-Generated Tags\`: Enable or disable automated tagging.

* \`Auto-Generated Websites\`, \`Auto-Generated Hints\`, \`Auto-Generated People\`: Fine-tune which content gets generated.

* \`Enrichment Level\`: Control how detailed the ML analysis should be.

* \`Enrichment Mode\`: Decide between local, cloud, or blended.

* \`Long-Term Memory Engine\`: Provides temporal context, with an option to clear data.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/machine_learning.png" alt="" align="center" fullwidth="false" />

### Views & Layouts

[Views & Layouts](https://docs.pieces.app/products/desktop/configuration/aesthetics-layout#adjusting-layout) controls how you see content in Pieces.

You can set a \`Default Layout\`, choose how items are sorted in list or gallery views, and select a \`Default Search Mode\` like \`Neural Code Search (NCS)\`.

You’ll also find options for \`Confirmation Settings\` (for specific actions), toggles for usage or metrics summaries, and a \`Default Toolbar\` for newly saved snippets.

* \`Default Layout\`: Choose your preferred view on launch.

* \`Default Search Mode\`: Select how you search by default.

* \`Confirmation Settings\`: Control dialog prompts.

* \`Default Toolbar\`: Assign a default toolbar to new snippets.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/views_and_layouts.png" alt="" align="center" fullwidth="false" />

### Aesthetics

In the [Aesthetics](https://docs.pieces.app/products/desktop/configuration/aesthetics-layout) tab, customize the overall appearance of Pieces.

Switch between [light or dark mode](https://docs.pieces.app/products/desktop/configuration/aesthetics-layout#dark--light-mode), select an accent color for UI highlights, and \`Zoom In/Out\` to adjust the interface scale.

These controls help you create a comfortable coding environment for extended sessions.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/aesthetics_view.png" alt="" align="center" fullwidth="false" />

### Other Options & Settings Pages

[Additional preferences](https://docs.pieces.app/products/desktop/configuration/additional-settings) live here, including [in-app notifications](https://docs.pieces.app/products/desktop/configuration/additional-settings#notification-preferences) (to minimize distractions or stay fully informed), Release Notes (for the latest updates), and Power Tips (for efficiency boosts).

You can also manage Plugins, invite colleagues via *Refer a Friend*, and control how much crash or compliance data is shared under [Telemetry & Diagnostics.](https://docs.pieces.app/products/desktop/configuration/additional-settings#telemetry--diagnostics)

* \`In-App Notifications\`: Decide which alerts you receive.

* \`Release Notes\`: View the most recent updates.

* \`Power Tips\`: Learn shortcuts and advanced capabilities.

* \`Plugins\`: Extend Pieces with extra functionality.

* \`Refer a Friend\`: Invite others to use Pieces.

* \`Telemetry & Diagnostics\`: Configure data sharing preferences.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/navigation_then_settings/telemetry.png" alt="" align="center" fullwidth="false" />
`;

export default function MDX_desktop_navigation_settings() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_navigation_settings.displayName = 'MDX_desktop_navigation_settings';
MDX_desktop_navigation_settings.frontmatter = frontmatter;
