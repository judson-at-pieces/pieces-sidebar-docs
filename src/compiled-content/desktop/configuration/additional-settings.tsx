import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Additional Settings",
  "path": "/desktop/configuration/additional-settings",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Accessing Settings

To access the general **Settings** view, navigate to the \`Home Icon\`, type *“settings,”* and click Go to Settings. Alternatively, you can click the \`Settings\` gear in the bottom-left corner of the *default view.*

## Telemetry & Diagnostics

You can control whether or not Pieces collects crash data and anonymous usage information. The Pieces team uses this information to help fix bugs and improve the app.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/additional_settings/telemetry.png" alt="" align="center" fullwidth="false" />

To enable or disable **Telemetry,** check or uncheck the \`Tickbox\` to the right of the **Telemetry** setting.

<Callout type="tip">
  Participating in telemetry helps Pieces evolve more effectively, but you can opt out for greater privacy.
</Callout>

## Notification Preferences

Avoid unnecessary interruptions by customizing how and when you receive in-app alerts.

You can select the \`Bell\` icon under *Notifications* to enable \`All\`, \`Critical\`, or \`None\` to determine how many—and what type—of notifications you receive.

\`Critical\` notifications are regarded primarily as errors and alerts—i.e., if PiecesOS is not detected (an edge case).
`;

export default function MDX_desktop_configuration_additional_settings() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_configuration_additional_settings.displayName = 'MDX_desktop_configuration_additional_settings';
MDX_desktop_configuration_additional_settings.frontmatter = frontmatter;
