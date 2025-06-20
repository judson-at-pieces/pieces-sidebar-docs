
---
title: "Issues | Windows"
path: "/meet-pieces/troubleshooting/windows"
visibility: "PUBLIC"
---
***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/windows/troubleshooting_windows.png" alt="Displaying windows.png" align="left" fullwidth="true" />

***

## Installation & Updating Fixes

PiecesOS and the Pieces Desktop App can be downloaded in several ways, and the update process varies based on the method you used, like whether you installed them via WinGet or `.exe` files.

<on-device-storage />

## Manual Installation Methods

If you're experiencing difficulties with installing PiecesOS or the Pieces Desktop App, you can install both applications manually by downloading the standalone `.exe` or `.appinstaller` files.

### via EXE Files

You can download the individual `.exe` files for PiecesOS and the Pieces Desktop App by clicking the download links below.

<CardGroup cols={2}>
  <Card title="Download — PiecesOS (.EXE)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1744992859004/fa1743fa-66e4-4700-92da-0de69e676abe.webp" href="https://builds.pieces.app/stages/production/os_server/windows-exe/download?download=true&product=DOCUMENTATION_WEBSITE">
    **Step 1:** Download PiecesOS (.EXE)

    *Required Core Dependency*

    Windows 10 (1809) or higher required.
  </Card>

  <Card title="Download — Pieces Desktop App" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1744992861808/c9c77376-c282-4797-88dd-78b8a46e3aef.webp" href="https://builds.pieces.app/stages/production/pieces_for_x/windows-exe/download?download=true&product=DOCUMENTATION_WEBSITE" target="_blank">
    **Step 2:** Download Pieces for Developers (.EXE)

    *Alternative Method*

    Windows 10 (1809) or higher required.
  </Card>
</CardGroup>

### via WinGet

To install the Pieces Desktop App and PiecesOS using WinGet, follow these steps:

1. **Open a Terminal:** Launch Windows Terminal, Command Prompt, or PowerShell as *administrator*.

2. **Run the WinGet Command:** In the terminal, type `winget install "Pieces for Developers"` and press `enter`.

You may be prompted to enter `Y` or `N` to agree or disagree with the terms of use when installing the Pieces Desktop App—type and enter `Y` to proceed with the installation.

3. **Install PiecesOS:** Next, install PiecesOS by typing `winget install "Pieces OS"` and pressing `enter`.

You will be prompted to agree or disagree to the terms of use a second time, so enter `Y` to proceed with the installation.

Once this is finished, you can now launch the Pieces Desktop App by pressing the **Windows symbol** (`⊞`) or toggling the search bar and typing **Pieces,** clicking `Pieces Desktop`.

## Versions & Updates

Many issues can stem from out-of-date plugins, extensions, the desktop app, or PiecesOS itself.

### Updating PiecesOS

To restart and check for updates to PiecesOS on Windows:

1. Locate the Pieces Icon (`P`) in your taskbar

2. Click the icon to view your update status

3. If an update is available, follow the on-screen prompt to download and install it.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/windows/windows_checking_pieces_os_for_updates.gif" alt="" align="center" fullwidth="true" />

For standalone .EXE installations, updates are checked daily or upon application launch, prompting you to install or delay as needed.

### Updating the Pieces Desktop App

Updating the Pieces Desktop App on Windows (and macOS) can be done directly within the application:

1. Open the Pieces Desktop App

2. Click the **User Icon** to the right of the **Search Bar** at the top of the main app view

3. Select `Check for Desktop App Updates`

4. If prompted, click `Download Update` install available updates

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/windows/windows_check_pfd_for_updates.gif" alt="" align="center" fullwidth="true" />

You can also select `Check for PiecesOS Updates` from the same menu as an alternative to doing so from the PiecesOS system window in your taskbar.

## Issues Launching PiecesOS

Some users who have enabled Controlled Folder Access (CFA) as a security measure may receive a notification that Pieces is attempting to bypass this security wall.

To work around this issue, you will need to *add the executable path for PiecesOS* to your allowlist.

<Callout type="alert">
  The reason PiecesOS fails to launch when CFA is enabled is that the executable path for the PiecesOS application writes data to your Documents folder.

  CFA disables and blocks any request to modify files (in this case, writing & saving data), so PiecesOS is unable to launch itself.
</Callout>

Keep in mind that this path references the specific PiecesOS version, and so will change over time as long as you continue to update the software.

You can also disable CFA as a security measure if you do not require it as part of an enterprise scenario or for any other reason.

To decide which apps PiecesOS has access to, you can [easily enable and disable specific sources from the Long-Term Memory Access Control](https://docs.pieces.app/products/core-dependencies/pieces-os/quick-menu#long-term-memory-access-control) panel.

## Common Installation Issues

Windows users may encounter installation issues for various reasons, such as out-of-date OS components or incomplete dependencies.

### Checking for Windows Updates

Before installing, ensure your Windows system is fully updated:

1. Click the **Start** button, then select `Settings`

2. Click `Windows Update`

3. Install any pending updates and restart your computer

### Updating the Microsoft Store & App Installer

1. Open the **Microsoft Store**

2. Click on `Library` to check for available updates

3. Update the Microsoft Store and the App Installer if prompted

4. Retry installing the Pieces Suite

## Checking Hardware Specifications

It may be necessary to verify your system's specifications if you experience ongoing issues, especially when attempting to utilize local LLMs.

To check your device specifications on Windows:

* Press the `Windows` key on your keyboard, or the `Windows` icon in the taskbar

* Type `run` and hit `enter`

* Type `dxdiag` and press enter on, or click, the blue `OK` button

The **System** tab displays your processor, the number of CPU cores, and memory (RAM), while the **Display** tab lists your GPU, its manufacturer (NVIDIA, AMD, Intel, etc.), and the available video memory (VRAM).

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/windows/windows_checking_hardware_specs.gif" alt="" align="center" fullwidth="true" />

[Read documentation on the minimum recommended hardware specifications across all OS platforms.](https://docs.pieces.app/products/meet-pieces/troubleshooting/cross-platform#hardware-recommendations)

### Checking Windows Version

If the Pieces Installer is not working as intended, you could have an outdated version of Windows. The minimum Windows version that Pieces will run on is **Windows 10 20H0 or higher**.

To check what version of Windows you're running:

* Press the `Windows` and the `R` keys simultaneously on your keyboard

* A new window will pop up, type `winver` and press `Enter`

A new window will open called **About Windows**, which will display your current Windows version.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/troubleshooting/windows/checking_windows_ver.gif" alt="" align="center" fullwidth="true" />

<Callout type="tip">
  If this doesn't work, you're likely using a Windows version older than Windows 10.
</Callout>

## Restart & Retry

If the problem persists, please open a <a href="https://github.com/pieces-app/support/issues" target="_blank" rel="noopener noreferrer">GitHub issue</a> for further assistance or book a call with our engineers.
