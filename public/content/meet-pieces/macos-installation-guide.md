
---
title: "Installation Guide | macOS"
path: "/meet-pieces/macos-installation-guide"
visibility: "PUBLIC"
---
***

<Image src="https://cdn.hashnode.com/res/hashnode/image/upload/v1740163265159/1c6da573-32cf-4256-8c67-921cd431a1c2.png" alt="" align="center" fullwidth="true" />

***

## Recommended Installation Method

Click the **buttons below** to download Pieces for your macOS device.

<CardGroup cols={2}>
  <Card title="Download — PiecesOS & Pieces Desktop App (ARM)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1747074321429/80687359-563d-425d-a6c5-37b7b81a6dc5.png" href="https://builds.pieces.app/stages/production/macos_packaging/pkg-arm64/download?download=true&product=DOCUMENTATION_WEBSITE" target="_blank">
    *macOS 13.0 (Ventura) or higher required*
  </Card>

  <Card title="Download — PiecesOS & Desktop App (Intel)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1747074283357/7fb8bef5-ce0d-4412-876e-88a8d4afabd8.png" href="https://builds.pieces.app/stages/production/macos_packaging/pkg/download?download=true&product=DOCUMENTATION_WEBSITE" target="_blank">
    *macOS 13.0 (Ventura) or higher required*
  </Card>
</CardGroup>

<Callout type="alert">
  PiecesOS is a required Core Dependency. Please install it alongside the Pieces Desktop App.
</Callout>

## Install the PKG

Once you've downloaded the correct `.pkg` file, it's time to run the installer.

<Steps>
  <Step title="Open the Installer">
    Double-click the `.pkg` file to launch the macOS installer.
  </Step>

  <Step title="Follow the On-Screen Prompts">
    Navigate through the introduction screen, select the install location, and enter your administrator credentials if prompted, then click `Install Software`.
  </Step>
</Steps>

### System Requirements

There are **(2)** requirements for installing Pieces on your macOS device:

1. Compatible OS Version—**macOS 13.0 (Ventura) or higher**

2. Compatible installer for your device's architecture—**Apple Silicon (ARM) or Intel**

Click here for a quick guide on [determining your OS type](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos#checking-os-version), and here for [how to check your device's CPU architecture.](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos#checking-cpu-type)

***

| **Component**      | **Minimum**                                                                   | **Recommended**                      | **Notes**                                                        |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| *CPU*              | Any modern CPU                                                                | Multi-core CPU                       | Avoid dual-core processors—aim for at least a 4-core CPU.        |
| *RAM (Local Mode)* | 8 GB total system RAM with 2 GB free                                          | 16 GB total system RAM or more       | Applies when PiecesOS is running locally.                        |
| *RAM (Cloud Mode)* | 8 GB total system RAM with 1 GB free                                          | 16 GB total system RAM or more       | Applies when PiecesOS is running in cloud mode.                  |
| *Disk Space*       | 2 GB minimum (1 GB for PiecesOS + 0.5–1 GB for data), with at least 4 GB free | 8 GB with at least 6 GB free or more | Ensure additional free space for data storage and future growth. |

***

## Alternative Installations

If you cannot use the `.pkg` installer for any reason, you can install PiecesOS and the Pieces Desktop App using standalone `.dmg` files or by using `Homebrew` through your Mac's terminal.

### via DMG (Apple Silicon / M-Series / ARM)

Install both PiecesOS and the Pieces Desktop App **in order** by clicking the download cards below for your ARM device.

<CardGroup cols={2}>
  <Card title="Download — PiecesOS (DMG / ARM)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1741277926767/73a4deec-0825-4138-9d1f-247b1c149866.webp" href="https://builds.pieces.app/stages/production/os_server/dmg-arm64/download" target="_blank">
    **Step 1:** Download PiecesOS

    ***

    *Required Dependency*

    macOS 13.0 (Ventura) or higher required.
  </Card>

  <Card title="Download — Pieces Desktop App (DMG / ARM)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1741277928929/0bcc9837-5849-411e-98ef-6ad9e118c36f.webp" href="https://builds.pieces.app/stages/production/pieces_for_x/dmg-arm64/download" target="_blank">
    **Step 2:** Download the Desktop App

    ***

    *Recommended Method*

    macOS 13.0 (Ventura) or higher required.
  </Card>
</CardGroup>

### via DMG (Intel)

Install both PiecesOS and the Pieces Desktop App **in order** by clicking the download cards below for your Intel device.

<CardGroup cols={2}>
  <Card title="Download — PiecesOS (DMG / Intel)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1742414057539/e91879e6-3aa5-4473-a944-6426ef7113d3.png" href="https://builds.pieces.app/stages/production/os_server/dmg/download" target="_blank">
    **Step 1:** Download PiecesOS

    ***

    *Required Dependency*

    macOS 13.0 (Ventura) or higher required.
  </Card>

  <Card title="Download — Pieces Desktop App (DMG / Intel)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1742414060905/c16603bc-e289-45f8-b027-61d035a1e09e.png" href="https://builds.pieces.app/stages/production/pieces_for_x/dmg/download" target="_blank">
    **Step 2:** Download the Desktop App

    ***

    *Recommended Method*

    macOS 13.0 (Ventura) or higher required.
  </Card>
</CardGroup>

## Install the DMG

After downloading the correct `.dmg` file, it's time to install the Pieces Desktop App.

<Steps>
  <Step title="">
    Open your **Downloads** folder (or wherever you saved the installer) and look for the `.dmg` file you just downloaded (e.g., `Pieces.dmg`).
  </Step>

  <Step title="Mount the DMG">
    Double-click the `.dmg` file to mount it.
  </Step>

  <Step title="Drag & Drop into Applications">
    Drag the application icon from the mounted `.dmg` window into your **Applications** folder.
  </Step>

  <Step title="Eject the DMG">
    Go back to **Finder**, right-click the mounted image, and select **Eject** to unmount it.
  </Step>
</Steps>

## Install Using Homebrew

Alternatively, you may opt to install Pieces via Homebrew in your terminal.

<Card title="Installing via Homebrew" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1741278053952/7feb3fa1-4a4b-47ff-86c2-326cf634f593.png">
  You can install PiecesOS manually using Homebrew from your device's terminal.

  To do so:

  1. Ensure Homebrew is installed on your system.

  2. Run `brew install --cask pieces` in your terminal and press `return` to install the Pieces `brew` package.

  This command installs both the Pieces Desktop App and PiecesOS cask. If prompted, enter your administrator password.

  3. Wait for installation to complete—Homebrew will download and install the necessary files.

  Once it's done, you'll see a message indicating successful installation.
</Card>

## Post-Installation Tips

Read the documentation below for some tips and information to make sure you're up and running with the latest version(s) of PiecesOS and the Pieces Desktop App, as well as steps to uninstall Pieces software from your Apple device.

### Updating

The Pieces Desktop App automatically downloads and installs new updates.

You can also manually check for updates to PiecesOS and the Pieces Desktop App by clicking the `Profile` icon nested in the **Search Bar** at the top of your Pieces Desktop App view, then selecting `Check for Desktop App Updates` or `Check for PiecesOS Updates`.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/get_started/macos/macos_check_pfd_for_updates_profile_dropdown.gif" alt="" align="center" fullwidth="true" />

### Uninstalling

On your macOS device, navigate to **Finder,** then select **Applications.**

Scroll or search until you find both `Pieces` and `PiecesOS.` Right-click on these two applications and select `Move to Trash`.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/get_started/macos/macos_how_to_uninstall_pfd.gif" alt="" align="center" fullwidth="true" />

## Additional Resources

Click here for additional [documentation on troubleshooting](https://docs.pieces.app/products/meet-pieces/troubleshooting/macos) or reach out to [support.](https://docs.pieces.app/products/support)
