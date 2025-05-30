import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Cross-Platform Issues",
  "path": "/desktop/troubleshooting/cross-platform",
  "visibility": "PUBLIC"
};

const markdownContent = `***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/cross_platform/troubleshooting_multiOS.png" alt="" align="center" fullwidth="true" />

***

## Basic Troubleshooting

Find links to detailed sections on specific troubleshooting steps as well as information on choosing between cloud and local models, system requirements, and more.

<on-device-storage />

## Versions & Updates

Many issues can stem from having an out-of-date Pieces Desktop App.

### Updating Pieces Desktop

The Pieces Desktop App will update automatically.

For standalone & alternative installations, updates are checked daily or when you open the application. You'll be prompted to install or delay the update if one is available.

See your platform-specific update instructions on updating the Pieces for Developers Desktop App:

* [macOS](https://docs.pieces.app/products/desktop/troubleshooting/macos#updating-the-pieces-desktop-app)

* [Windows](https://docs.pieces.app/products/desktop/troubleshooting/windows#updating-pieces-desktop-app)

* [Linux](https://docs.pieces.app/products/desktop/troubleshooting/linux#updating-pieces-desktop)

## Connection Issues with Pieces Desktop

You may occasionally encounter connection issues between PiecesOS and Pieces Desktop App, resulting in difficulty finding saved materials, issues generating shareable links, and hanging responses from the Pieces Copilot.

The quickest way to resolve this basic connection issue is to restart PiecesOS and the Pieces Desktop App, then check for updates.

### Restarting Pieces Suite & Checking Updates

To restart and check for updates for PiecesOS and Pieces Desktop:

<Steps>
  <Step title="Make Sure PiecesOS is Running">
    Ensure PiecesOS is running (look for the Pieces Icon in your system tray or menu bar)
  </Step>

  <Step title="Exit PiecesOS">
    Click on the PiecesOS icon and press the \`power off\` button or the \`exit\` button in the top right.
  </Step>

  <Step title="Close Pieces for Developers">
    Make sure the Pieces Desktop App is closed by clicking the \`x\` button on the top right or by closing it through task manager.
  </Step>

  <Step title="Open Pieces Desktop">
    After opening Pieces Desktop App, PiecesOS will open automatically

    * If there are updates, you will be prompted to update both PiecesOS and Pieces for Developers.
  </Step>
</Steps>

## Common Installation Issues

Common issues can occur when setting up the Pieces Desktop App for the first time.

Platform-specific solutions are detailed on their respective OS pages:

* [macOS](https://docs.pieces.app/products/desktop/troubleshooting/macos#common-installation-issues)

* [Windows](https://docs.pieces.app/products/desktop/troubleshooting/windows#common-installation-issues)

* [Linux](https://docs.pieces.app/products/desktop/troubleshooting/linux#common-installation-issues)

## Checking Hardware

It may be necessary to verify your system’s specifications if you experience ongoing issues.

See the OS-specific pages for instructions on how to check CPU, RAM, and GPU details:

* [macOS](https://docs.pieces.app/products/desktop/troubleshooting/macos#checking-os-version)

* [Windows](https://docs.pieces.app/products/desktop/troubleshooting/windows#checking-hardware-specifications)

* [Linux](https://docs.pieces.app/products/desktop/troubleshooting/linux#checking-system-information)
`;

export default function MDX_desktop_troubleshooting_cross_platform() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_troubleshooting_cross_platform.displayName = 'MDX_desktop_troubleshooting_cross_platform';
MDX_desktop_troubleshooting_cross_platform.frontmatter = frontmatter;
