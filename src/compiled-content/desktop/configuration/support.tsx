import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Support & Information",
  "path": "/desktop/configuration/support",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Accessing Settings

To access the general **Settings** view, navigate to the \`Home Icon\` and type *settings* then click \`Go to Settings\`—or you can click the \`Settings\` gear in the bottom-left corner of the *default view.*

## Discover & Support Sections

No matter which tab you select in **Settings** (e.g., [Machine Learning](https://docs.pieces.app/products/desktop/configuration/copilot-and-machine-learning#machine-learning), [Telemetry](https://docs.pieces.app/products/desktop/configuration/additional-settings#telemetry--diagnostics), [Aesthetics](https://docs.pieces.app/products/desktop/configuration/aesthetics-layout)), you’ll always see three smaller sections at the bottom of that specific settings view. 

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/settings_with_mcp_update/support_and_information/support_and_feedback.png" alt="" align="center" fullwidth="false" />

These three sections are “sticky,” meaning they’re appended to the end of every Settings tab for quick access.

### Support

Links to support resources and keyboard shortcuts.

***

| **Button / Action**                                                                                 | **Explanation**                                    |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [*Documentation*](https://docs.pieces.app)                                                          | Opens Pieces’ official documentation.              |
| <a target="_blank" href="https://github.com/pieces-app/support/issues">*Submit Feedback/Issues*</a> | Redirects you to a feedback or bug-reporting flow. |
| [*Keyboard Shortcuts*](https://docs.pieces.app/products/desktop/actions/keyboard-shortcuts)         | Displays or links to a list of relevant hotkeys.   |

***

### Desktop App Information

Check the active app version, check for updates, get platform information, and launch onboarding if you want to familiarize yourself with the fundamentals of the Pieces Desktop App.

***

| **Button / Action**             | **Explanation**                                                         |
| ------------------------------- | ----------------------------------------------------------------------- |
| *Desktop App Version*           | Shows the installed version of the Pieces Desktop App.                  |
| *Check for Desktop App Updates* | Manually triggers an update check to see if a new version is available. |
| *Launch Onboarding*             | Re-opens the guided setup workflow.                                     |
| *Platform*                      | Displays OS & platform details (e.g., macOS 15.1.1).                    |

***

### PiecesOS Information

View the installed PiecesOS version, check for updates and see what port PiecesOS is calling to.

***

| **Button / Action**          | **Explanation**                                         |
| ---------------------------- | ------------------------------------------------------- |
| *PiecesOS Version*           | Displays the currently installed version of PiecesOS.   |
| *Check for PiecesOS Updates* | Manually triggers an update check for PiecesOS.         |
| *PiecesOS Port*              | Lists the port number currently being used by PiecesOS. |

***
`;

export default function MDX_desktop_configuration_support() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_configuration_support.displayName = 'MDX_desktop_configuration_support';
MDX_desktop_configuration_support.frontmatter = frontmatter;
