---
title: "Issues | macOS"
path: "/desktop/troubleshooting/macos"
visibility: "PUBLIC"
---
***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/macos/troubleshooting_macos.png" alt="" align="center" fullwidth="true" />

***

## Installation & Updating Fixes

PiecesOS and the Pieces Desktop App can be downloaded using several installation methods, and they can be updated differently depending on the method used.

You can also find information below on how to determine the CPU architecture and OS version of your Apple device.

<on-device-storage />

## Manual Installation Methods

If you're having trouble installing PiecesOS or the Pieces Desktop App, you can manually install both software by downloading the standalone `.dmg` files or using terminal commands, instead of the recommended `.pkg` method.

<Callout type="alert">
  If you’re not sure which `.dmg` you need based on your device’s CPU, [click here.](https://docs.pieces.app/products/desktop/troubleshooting/macos#checking-cpu-type)
</Callout>

<CardGroup cols={2}>
  <Card title="Pieces Desktop App — ARM .DMG" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1740693233214/29654e9b-14b6-44e5-a9e1-cdadb65ddb47.webp" href="https://builds.pieces.app/stages/production/os_server/dmg/download?download=true&product=DOCUMENTATION_WEBSITE" external="true">
    *macOS 13.0 (Ventura) or higher*
  </Card>

  <Card title="Pieces Desktop App — Intel .DMG" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1740693234272/7a5de5db-9b57-4cd9-9300-14544075e954.webp" href="https://builds.pieces.app/stages/production/pieces_for_x/dmg/download?download=true&product=DOCUMENTATION_WEBSITE" external="true">
    *macOS 13.0 (Ventura) or higher*
  </Card>
</CardGroup>

<Card title="Installing via Homebrew" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1740695766570/dc1efa5e-6e16-47f6-a417-94e1356e2d88.webp">
  You can also install PiecesOS manually using Homebrew from your device’s terminal.

  To do so:

  1. Ensure Homebrew is installed on your system.

  2. Run `brew install --cask pieces-os` in your terminal to install the Pieces Homebrew package.
</Card>

## Versions & Updates

Many issues can stem from out-of-date plugins, extensions, PiecesOS, or the desktop app itself.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/macos/macos_checking_piecesos_for_updates.gif" alt="" align="center" fullwidth="true" />

### Updating the Pieces Desktop App

Update the Pieces Desktop App on macOS by clicking the `User Icon` next to the **search bar** at the top of the Pieces Desktop Window. Then, click `Check for Desktop App Updates` or `Check for PiecesOS Updates`.

To check the Pieces Desktop App for updates on macOS:

<Steps>
  <Step title="Open the Pieces Desktop App">
    Use the **Search** option or locate the Pieces Desktop App within your *Applications* folder
  </Step>

  <Step title="Locate the Update Option">
    Click the `User Icon` to the right of the **Search Bar** at the top of the main app view
  </Step>

  <Step title="Check for Updates">
    Click the `Check for Desktop App Updates` option
  </Step>
</Steps>

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/macos/macos_check_pfd_for_updates_profile_dropdown.gif" alt="" align="center" fullwidth="true" />

You can also click `Check for PiecesOS Updates` as an alternative to doing so in from the PiecesOS system window in your taskbar.

## Common Installation Issues

Common installation issues on Apple devices include having an outdated OS version or choosing the wrong installation package.

### Checking OS Version

Pieces applications need at least **macOS 13.0 (Ventura).** If you're having installation problems, first check that your OS version is up-to-date.

To determine your Apple device’s version of macOS:

<Steps>
  <Step title="Locate the Apple Icon">
    Click the `Apple Icon` in the top-left corner of your screen
  </Step>

  <Step title="Learn More About your Mac">
    Select `About This Mac`
  </Step>

  <Step title="Find your OS Version">
    Under your device name (i.e. MacBook Air), look for the last line on the list, titled **macOS**

    <Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/macos/macos_checking_about_mac.gif" alt="" align="center" fullwidth="true" />
  </Step>
</Steps>

### Checking CPU Type

Intel and Apple Silicon (ARM) devices run on entirely separate CPU architectures, so downloading the wrong package for your Apple device can cause Pieces Desktop to be rendered useless.

To determine what CPU architecture your Apple device utilizes:

<Steps>
  <Step title="Open the Apple Options">
    Click the `Apple Icon` in the top-left corner of your screen.
  </Step>

  <Step title="Locate Mac Information">
    Select `About This Mac`, and look for the **Overview section.** The first line will contain your CPU type:

    * **Apple Silicon / ARM:** You will see an M-Series processor (i.e., Apple M3)

    * **Intel:** You will see an Intel processor (i.e., 2.6 GHz Intel Core i7)

    Once you’ve determined your CPU architecture, [download the correct installation package accordingly.](https://docs.pieces.app/products/desktop/troubleshooting/macos#alternative-installation-methods)
  </Step>
</Steps>

## Restart & Retry

If the installation fails because your macOS version is outdated or you installed the wrong package for your device's architecture, restart your machine and try the installation again from the beginning.

If the problem persists, please open a <a target="_blank" href="https://github.com/pieces-app/support/issues">GitHub issue</a> for further assistance, or book a call with our engineers.
