---
title: "Using Long-Term Memory Context"
path: "/quick-guides/ltm-context"
visibility: "PUBLIC"
---
***

## Prerequisites

To complete this Quick Guide, you’ll need:

1. **The Pieces Desktop App** installed and actively running on your device.

2. **Long-Term Memory** enabled in the Pieces Desktop App.

To enable the LTM-2 Engine from PiecesOS, click the PiecesOS icon to open the [Quick Menu](https://docs.pieces.app/products/core-dependencies/pieces-os/quick-menu#ltm-2-engine) on Windows or macOS, then select `Enable Long-Term Memory Engine`.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/core_dependencies_assets/pieces_os_main/quick_menu/macos_enable_ltm.gif" alt="" align="center" fullwidth="true" />

## In This Quick Guide

In this Quick Guide, you’ll use [Pieces Long-Term Memory](https://docs.pieces.app/products/core-dependencies/pieces-os#ltm-2) to save context from a website, then prompt the Pieces Copilot to tell you what it saw.

<Card title="Want a Sneak Peak?" image="https://cdn.hashnode.com/res/hashnode/image/upload/v1745425412321/d0262633-bbd5-4369-b8a3-2c68a1a1b544.webp">
  Here’s a <a target="_blank" href="https://tsavo.hashnode.dev/temporal-nano-model-breakthrough">quick read on some of the nano-models</a> we develop that layer into the data retrieval pipeline for LTM-2 and the coming *LTM-2.5*
</Card>

This demonstrates how Pieces can capture information from any application and make it available to you in the Pieces Copilot.

### Capture Context

With LTM enabled, Pieces captures workflow context from every actively used window, including the browser you’re using to read this Quick Guide.

<Steps>
  <Step title="Generate a Secret Message">
    <a target="_blank" href="https://pieces.app/magic-moments/ltm">Click this link</a> to generate a message Pieces can capture in a new tab.
  </Step>

  <Step title="Let Pieces Capture Your Context">
    Read the message and give Pieces a second or two to capture the context from your browser.
  </Step>
</Steps>

### Prompt the Copilot

Now that Pieces has captured the message, you can prompt the Pieces Copilot through the Pieces Desktop App to retrieve the secret message.

<Steps>
  <Step title="Open the Pieces Desktop App">
    Open the Pieces Desktop App and start a new chat or use an existing chat.
  </Step>

  <Step title="Prompt the Pieces Copilot">
    Use the following prompt with the Pieces Copilot:

    ```plaintext
    What is my secret message?
    ```
  </Step>
</Steps>

### Get your Secret Message

Once prompted, Pieces Copilot should generate a response containing the contents of the *Secret Message* you were given, as it was captured by LTM.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/quick_guides/using_long_term_memory_context/secret_message.png" alt="" align="center" fullwidth="true" />

<Callout type="tip">
  Congratulations, you’ve completed the *Using Long-Term Memory Context* Quick Guide! 🎉
</Callout>
