import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Installation Guide | Windows",
  "path": "/meet-pieces/windows-installation-guide",
  "visibility": "PUBLIC"
};

const markdownContent = `***

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/trimmed_windows_banner.png" alt="" align="center" fullwidth="true" />

***

## Recommended Installation Method

The recommended installation method on Windows is using the \`.appinstaller\` files for PiecesOS and the Pieces Desktop App.

Download PiecesOS and the Pieces Desktop App **in order** by clicking the download cards below.

<CardGroup cols={2}>
  <Card title="Download — PiecesOS" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1744838532993/0aceacdb-4e3f-4e09-8175-eb8b389f26e9.webp" href="https://builds.pieces.app/stages/production/appinstaller/os_server.appinstaller">
    **Step 1:** Download PiecesOS (.appinstaller)

    *Required Core Dependency*

    Windows 10 (1809) or higher required.
  </Card>

  <Card title="Download — Pieces Desktop App" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1744838536184/842e4eed-5111-45d2-8157-23bb8fa64049.webp" href="https://builds.pieces.app/stages/production/appinstaller/pieces_for_x.appinstaller">
    **Step 2:** Download the Desktop App (.appinstaller)

    *Recommended Method*

    Windows 10 (1809) or higher required.
  </Card>
</CardGroup>

<Callout type="alert">
  PiecesOS is a **required** Core Dependency. Please install it alongside the Pieces Desktop App.
</Callout>

## Install the AppInstaller Files

Now that you have downloaded the \`.appinstaller\` files, it’s time to install Pieces.

<Steps>
  <Step title="Find Saved Location">
    Open your **Downloads** folder (or wherever you saved the installer) and look for the \`.appinstaller\` file you just downloaded (e.g., *pieces-os.appinstaller*).
  </Step>

  <Step title="Open the Installer">
    Double-click the \`.appinstaller\` file to launch the installation wizard.
  </Step>
</Steps>

Installing via \`.appinstaller\` or \`.exe\` may cause some user prompt windows to open up—read more about them below.

### Updating PiecesOS (AppInstaller)

Note that currently, updating PiecesOS if installed via the \`.appinstaller\` (currently the *Recommended* installation method) files requires that you **quit the Pieces Desktop App**, then proceed with updating PiecesOS.

If this fails, make sure that the Pieces Desktop App is fully quit, as well as PiecesOS—then relaunch PiecesOS and proceed to download and install the update.

### System Requirements

Your Windows device must be running **Windows 10 (1809) or higher.**

Click here for a quick guide on [determining your OS version](https://docs.pieces.app/products/meet-pieces/troubleshooting/windows#checking-windows-version).

***

| **Component**      | **Minimum**                                                                   | **Recommended**                      | **Notes**                                                        |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| *CPU*              | Any modern CPU                                                                | Multi-core CPU                       | Avoid dual-core processors—aim for at least a 4-core CPU.        |
| *RAM (Local Mode)* | 8 GB total system RAM with 2 GB free                                          | 16 GB total system RAM or more       | Applies when PiecesOS is running locally.                        |
| *RAM (Cloud Mode)* | 8 GB total system RAM with 1 GB free                                          | 16 GB total system RAM or more       | Applies when PiecesOS is running in cloud mode.                  |
| *Disk Space*       | 2 GB minimum (1 GB for PiecesOS + 0.5–1 GB for data), with at least 4 GB free | 8 GB with at least 6 GB free or more | Ensure additional free space for data storage and future growth. |

***

## Alternative Installations

If you prefer an alternative installation method aside from the \`.appinstaller\` method, you can also use the \`exe\` installers or \`WinGet\` commands through your terminal.

### via EXE

If you cannot use the \`.appinstaller\` method for any reason, you can also install via standalone \`.exe\` files.

<CardGroup cols={2}>
  <Card title="Download — PiecesOS (EXE)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1744838635517/4e03efa6-cdd4-4187-a2c9-8fabb128b291.webp" href="https://builds.pieces.app/stages/production/os_server/windows-exe/download?download=true&product=DOCUMENTATION_WEBSITE&_gl=1*h3r9du*_gcl_au*MTIwMTc3MzI1NS4xNzQxMDIwNzMx*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*MTc0MTc4OTgwNS40LjEuMTc0MTgwMjA0OS41OC4wLjA.">
    **Step 1:** Download PiecesOS

    *Required Core Dependency*

    Windows 10 (20H0) or higher required.
  </Card>

  <Card title="Download — Pieces Desktop App (EXE)" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1744838637934/aeebf045-f502-4896-8d99-104607d9ede1.webp" href="https://builds.pieces.app/stages/production/pieces_for_x/windows-exe/download?download=true&product=DOCUMENTATION_WEBSITE&_gl=1*1a9yqbf*_gcl_au*OTQ5NDE1NTA4LjE3Mzk0NjU4MzM.*_ga*MTI0OTgzMTMuMTcyNDA5ODQwNg..*_ga_BVYEFRWCYX*MTc0MDc4MjM4Mi44LjAuMTc0MDc4MjM4Mi42MC4wLjA.">
    **Step 2:** Download the Desktop App

    *Alternative Method*

    Windows 10 (20H0) or higher required.
  </Card>
</CardGroup>

<Steps>
  <Step title="Find Saved Location">
    Open your **Downloads** folder (or wherever you saved the file) and look for the \`.appinstaller\` file you just downloaded (e.g., *pieces-desktop.appinstaller*).
  </Step>

  <Step title="Open the Installer">
    Double-click the \`.appinstaller\` file to launch the Windows installation prompt.
  </Step>
</Steps>

### via WinGet

WinGet will allow you to easily install Pieces without having to leave the terminal

<CardGroup cols={2}>
  <Card title="WinGet — PiecesOS" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1742407333527/2124ccc5-5015-4be6-909e-4a743fc02104.webp">
    **Step 1:** Install PiecesOS

    1. Launch a Windows Terminal, Command Prompt, or PowerShell as administrator.

    2. Next, install PiecesOS by typing \`winget install “Pieces OS”\` and pressing \`enter\`.

    You may be prompted to enter \`Y\` or \`N\` to agree or disagree the terms of use when installing the Pieces Desktop App—type and enter \`Y\` to proceed with the installation.
  </Card>

  <Card title="WinGet — Pieces for Developers" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1742407336840/6b4388ed-d065-4afa-9459-699b78240db3.webp">
    **Step 2:** Install the Desktop App

    1. Use the same Windows Terminal, Command Prompt, or PowerShell window as before—or launch a new window.

    2. Then, type \`winget install “Pieces for Developers”\` and press \`enter\`.

    You will be promoted to agree or disagree to the terms of use a second time, so enter \`Y\` to proceed with the installation.
  </Card>
</CardGroup>

## On-Screen Prompts

There are a series of on-screen prompts to navigate through when installing the Pieces Desktop App and PiecesOS, through either the \`.exe\` or \`.appinstaller\` installation methods.

1. **User Account Control (UAC):** If prompted by Windows’ User Account Control, click \`Yes\` to allow the installer to make changes.

2. **Install Location:** Choose where to install Pieces (default location is recommended) and click \`Install\`.

3. **Select Additional Tasks:** Check \`Create a desktop shortcut\` or \`Automatically start Pieces for Developers\` if preferred.

4. **Ready to Install:** Click \`Install\`**.**

5. **Installation Progress & Completion:** Wait for the installation to complete. Once finished, you’ll see a confirmation message. Click \`Finish\` to close the installer.

## Enterprise & Advanced Security Considerations

Some Windows systems—particularly those in enterprise environments or with advanced security settings—may require using an \`.exe\` package (default installer) instead of an \`.appinstaller\` package (AppInstaller) for compatibility reasons.

If you find that your environment is restrictive or that the \`.appinstaller\` package doesn’t work properly, consider using the \`.exe\` version or an alternative method.

## Post-Installation Tips

Read the documentation below for some tips and information to make sure you’re up and running with the latest version(s) of PiecesOS and the Pieces Desktop App, as well as steps to uninstall Pieces software from your Windows device.

### Updating

The Pieces Desktop App **automatically downloads and installs new updates.**

You can also manually check for updates to PiecesOS and the Pieces Desktop App by clicking the \`Profile\` nested in the **Search Bar** at the top of your Pieces Desktop App view, then selecting \`Check for Desktop App Updates\` or \`Check for PiecesOS Updates\`.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/get_started/windows/windows_check_pfd_for_updates.gif" alt="" align="center" fullwidth="true" />

### Uninstalling

Open **Settings,** then find **Apps** and search \`Pieces.\`

Two applications will appear after you enter the search query—**Pieces Desktop** and **PiecesOS.** Click the three dots to the right of the application title, and click \`Uninstall\`.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/meet_pieces_assets/meet_pieces/get_started/windows/uninstalling_on_windows.gif" alt="" align="center" fullwidth="true" />

## Additional Resources

Click here for additional [documentation on troubleshooting](https://docs.pieces.app/products/meet-pieces/troubleshooting) or reach out to [support.](https://docs.pieces.app/products/support)
`;

export default function MDX_meet_pieces_windows_installation_guide() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_meet_pieces_windows_installation_guide.displayName = 'MDX_meet_pieces_windows_installation_guide';
MDX_meet_pieces_windows_installation_guide.frontmatter = frontmatter;
