import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Troubleshooting",
  "path": "/meet-pieces/troubleshooting",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Using the Guides

Click one of the links below to get started troubleshooting on your device—or [browse the cross-platform troubleshooting documentation](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform) for more general fixes.

***

| [Cross-Platform](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform) | [macOS](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos) |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Windows](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows)               | [Linux](https://docs.pieces.app/products/meet-pieces/troubleshooting/linux) |

***

## Cross-Platform Issues

This cross-platform troubleshooting documentation covers the Pieces Desktop App and PiecesOS, including updates, connectivity, system requirements, best practices for running local LLMs with Ollama, model selection for your hardware, and solutions for crashes due to limited resources or GPU compatibility.

<Card title="macOS + Windows + Linux" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1743183951564/da11bcc8-4fdf-49a6-b4a9-079186686ece.png">
  Use the Cross-Platform page if you’re not sure where to begin or if your issue isn’t clearly related to your operating system.

  On the [Cross-Platform troubleshooting guide](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform), you’ll find:

  * [Tips on handling local LLM crashes due to hardware-related issues](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform#local-model-crashing)

  * [Guidance on working with Vulkan-based GPUs](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform#vulkan-based-gpus)

  * [Links to related documentation on checking hardware specifications on your OS](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform#checking-hardware)
</Card>

## macOS Issues

This macOS guide helps troubleshoot installation and update issues for PiecesOS and the Pieces Desktop App on macOS, covering manual installs (\`PKG\`, \`DMG\`, Homebrew), checking macOS version and CPU type, and fixing compatibility or outdated software problems.

<Card title="macOS" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1743183846135/c03b138c-4fb6-4202-afe4-4f3503393ff4.png">
  The [macOS troubleshooting guide](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos) provides information and guides on:

  * [How to verify your macOS software version](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos#checking-os-version)

  * [Determining and choosing the correct installation package for different chipsets](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos#checking-cpu-type)

  * [Updating PiecesOS and the Pieces Desktop App](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos#versions--updates)
</Card>

## Windows Issues

Windows users can find troubleshooting steps for installing, updating, or running PiecesOS and the Pieces Desktop App on Windows. It includes manual installation, update instructions, system checks, and solutions for issues with outdated Windows versions, dependencies, or hardware compatibility.

<Card title="Windows" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1743183998547/ab81fe73-85c3-4739-bb63-ac85824413c8.png">
  The [Windows troubleshooting guide](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows) provides information and guides on:

  * [Checking for Windows installation updates](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows#checking-for-windows-updates)

  * [Verifying the App Installer is up-to-date](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows#versions--updates)

  * [Alternative installation methods for non-Suite installs](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows#trying-different-installation-methods)

  * [Viewing hardware specifications using \`dxdiag\`](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows#checking-hardware-specifications)
</Card>

## Linux Issues

Ubuntu 22+ Linux users can use this guide to troubleshoot PiecesOS and the Pieces Desktop App. It covers updating via Snap, checking system compatibility, and fixing common installation or display issues. It also offers tips for adjusting GPU settings and verifying hardware and Ubuntu version compatibility.

<Card title="Linux" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1743184029199/1e8e5852-ca00-4843-91ca-20d8508c414b.png">
  The [Linux troubleshooting guide](https://docs.pieces.app/products/meet-pieces/troubleshooting/linux) provides information and guides on:

  * [Confirming compatibility with your Linux distribution](https://docs.pieces.app/products/meet-pieces/troubleshooting/linux#checking-distribution-compatibility)

  * [Using snap commands to update PiecesOS and the Pieces Desktop App](https://docs.pieces.app/products/meet-pieces/troubleshooting/linux#updating-piecesos)

  * [Adjusting graphics settings if you encounter UI issues](https://docs.pieces.app/products/meet-pieces/troubleshooting/linux#adjusting-graphics--display-settings)
</Card>

### Additional Assistance

If you’ve followed the applicable troubleshooting steps and still experience problems, consider visiting our community forums for additional guidance, opening a GitHub issue, or booking a call with our engineers.

[You can also find additional support resources here.](https://docs.pieces.app/products/support)
`;

export default function MDX_meet_pieces_troubleshooting() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_meet_pieces_troubleshooting.displayName = 'MDX_meet_pieces_troubleshooting';
MDX_meet_pieces_troubleshooting.frontmatter = frontmatter;
