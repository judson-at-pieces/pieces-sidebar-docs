import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Configuration",
  "path": "/desktop/configuration",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Accessing Settings

There are several ways to open up **Settings** in the Pieces Desktop App, where you can adjust account and cloud behaviors, check your application versions, change views and layouts, and more.

You can access **Settings** by clicking the profile picture icon in the upper-right and clicking \`All Settings\`.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/configuration/opening_settings_via_pfp.gif" alt="" align="center" fullwidth="true" />

<Callout type="tip">
  Or, click the *Settings Gear* icon in the bottom-left corner to open the **Settings** view.
</Callout>

You can also open up the **Power Menu** and search for *“settings”,* then click \`Go to Settings\` using the shortcuts in the table below:

| **macOS**  | **Windows**  | **Linux**    |
| ---------- | ------------ | ------------ |
| \`⌘+return\` | \`ctrl+enter\` | \`ctrl+enter\` |

### Account & Cloud

The [Account & Cloud](https://docs.pieces.app/products/desktop/configuration/account-and-cloud) section manages your Pieces account, cloud services, and backups. This ensures a seamless connection across devices and helps keep your data secure.

<Steps>
  <Step title="Cloud Management">
    Connect and sync with Pieces Cloud for *real-time access* across multiple devices, or monitor your connection status and manage sync preferences.
  </Step>

  <Step title="Database Backups">
    Automatically backup your snippets, files, and projects or restore previous versions in case of data loss.
  </Step>
</Steps>

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/account_and_cloud.png" alt="" align="center" fullwidth="false" />

### Pieces Copilot & Machine Learning

These [Pieces Copilot and Pieces Drive](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning) configuration sections let you adjust default behaviors related to metadata, LTM context, models, and local model processing.

<Steps>
  <Step title="Runtime">
    Change models, reset the active runtime if facing issues, and use Long-Term Memory (LTM) context by default, and more.
  </Step>

  <Step title="Enrichment">
    Adjust the level of auto-enrichment performed locally when Pieces Drive generates and assigns metadata to saved materials.
  </Step>
</Steps>

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/copilot_chats.png" alt="" align="center" fullwidth="false" />

### Model Content Protocol (MCP)

From this view, you can access the [*HTTP Server URL* for the Pieces MCP.](https://docs.pieces.app/products/desktop/configuration/mcp) This allows you to set up productivity tools and code editors that support this protocol with context directly from your local Pieces database.

You'll also find a *Book* icon that links you to documentation on getting started with the Pieces MCP and information about available integrations.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/configuration/mcp/model_context_protocol_pfd_settings.png" alt="" align="center" fullwidth="true" />

### Aesthetics & Layouts

The [Aesthetics & Layouts](https://docs.pieces.app/products/desktop/configuration/aesthetics-layout) section allows you to customize the visual appearance of the Pieces Desktop App, including dark and light modes, UI scaling, accent color, and more.

You can also set the default UI of different views and adjust default sorting and listing methods for displaying snippets & summaries

<Steps>
  <Step title="Dark & Light Mode">
    Adjust auto-switch settings based on system preferences.
  </Step>

  <Step title="Accent Colors">
    Select from various colors to adjust Pieces Copilot chat accents and other visual elements.
  </Step>

  <Step title="Font & UI Scaling">
    Increase or decrease font size and UI size for different screen resolutions.
  </Step>

  <Step title="Layout Settings">
    Set the default view to Pieces Copilot or Pieces Drive, default search mode, and default gallery & list views.
  </Step>

  <Step title="Default Search Mode">
    Choose between *Blended, Full-Text, Neural Code Search,* or *Search-with-Material* as the default search mode for the **Search Bar.**
  </Step>
</Steps>

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/aesthetics_view.png" alt="" align="center" fullwidth="false" />

### Additional Settings

The [Additional Settings](https://docs.pieces.app/products/desktop/configuration/additional-settings) section contains advanced configurations that allow you to fine-tune Pieces for Developers to suit your workflow.

<Steps>
  <Step title="Telemetry & Diagnostics">
    Enable or disable anonymous usage data collection and manage crash reporting and performance monitoring.
  </Step>

  <Step title="Notifications">
    Customize which in-app alerts you receive and the frequency of notification pop-up modals.
  </Step>

  <Step title="Shortcuts">
    View the default shortcuts for Pieces Desktop App functionality specific to your device’s operating system (OS).
  </Step>
</Steps>

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/telemetry.png" alt="" align="center" fullwidth="false" />

### Support & Information

Whenever you access the **Settings** view and click on a specific section—i.e., *Machine Learning, Telemetry,* or *Copilot Chats*—three smaller Support & Information sections are appended to the end of the focused settings view.

These always-available sections are:

1. **Support**: Contains links to documentation, submitting feedback or reporting issues, and all keyboard shortcuts.

2. **Desktop App Information**: This section lists the Pieces Desktop App version, lets you check for updates, launches onboarding, and provides your platform information.

3. **PiecesOS Information**: This page lists your PiecesOS version, lets you check for updates, and lists the active PiecesOS port.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/additional_settings.png" alt="" align="center" fullwidth="false" />
`;

export default function MDX_desktop_configuration() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_configuration.displayName = 'MDX_desktop_configuration';
MDX_desktop_configuration.frontmatter = frontmatter;
