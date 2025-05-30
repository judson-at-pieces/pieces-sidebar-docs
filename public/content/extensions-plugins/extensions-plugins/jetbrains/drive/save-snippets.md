---
title: "Saving"
path: "/extensions-plugins/jetbrains/drive/save-snippets"
visibility: "PUBLIC"
---
***

## Saving Snippets

There are several ways to save code with the Pieces for JetBrains plugin, such as through the right-click menu, hotkeys, or dragging and dropping code into the Pieces sidebar.

There’s also the fine-tuned saving feature called `Save to Pieces As`, which lets you edit and adjust the automatically-generated metadata to your liking.

### via Right-Click Menu

You can save snippets by accessing the tool menu.

To save a snippet using this method:

<Steps>
  <Step title="Choose your Snippet">
    Highlight the code you want to save.
  </Step>

  <Step title="Open Right-Click Menu">
    Right-click on the highlighted code and hover over the `Pieces` option.
  </Step>

  <Step title="Select Action">
    Select either `Save Current Selection to Pieces` or `Save File to Pieces`.

    <Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/jetbrains_plugin_assets/jetbrains_plugin_assets/using_snippets/saving_snippets/save_to_pieces.gif" alt="" align="center" fullwidth="true" />
  </Step>
</Steps>

This will trigger a success message in the bottom-right corner of your screen to let you know that the save was successful.

### via Keyboard Shortcut

Keyboard shortcuts are another easy way to save functional developer materials.

To save a snippet via keyboard shortcuts:

<Steps>
  <Step title="Choose your Snippet">
    Highlight the code you want to save.
  </Step>

  <Step title="Save your Snippet">
    Use the command `⌥+⌘+p` (macOS) or `ctrl+alt+p` (Windows/Linux) to save the code as a snippet.

    <Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/jetbrains_plugin_assets/jetbrains_plugin_assets/using_snippets/saving_snippets/saved_to_pieces.png" alt="" align="center" fullwidth="true" />
  </Step>
</Steps>

Saving a snippet via keyboard shortcut will trigger the same success modal in the bottom right-hand corner of your screen to let you know the save was successful.

### via Copilot Chat

When you start a conversation about a piece of code in your active file or have any code block in your Copilot Chat, you can save it to Pieces using the `Save to Pieces` button in the Copilot Chat view.

<Image src="https://cdn.hashnode.com/res/hashnode/image/upload/v1734039141656/abf74d05-29e7-4769-995c-2157939ff930.png" alt="" align="center" fullwidth="true" />

## What’s Stored When You Save a Snippet

When you save a snippet to your Pieces Cloud, more than just the code is stored.

The Pieces Copilot captures:

* `Type`: Categorizes the snippet (e.g., API call, function, class) with it’s code language.

* `Associated Tags`: Keywords related to the snippet for easier searching.

* `Custom Description`: Specifies precisely which *lines* (in numerical form) the snippet is from and the file from which it originated—very useful for mind-mapping.

* `Smart Description`: AI-generated descriptions that summarize the snippet’s purpose and function.

* `Suggested Searches`: Related searches that help you discover similar snippets.

* `Related Links`: References to documentation, code repositories, or other relevant resources.

* `Related People`: Associated collaborators or contributors.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/jetbrains_plugin_assets/jetbrains_plugin_assets/using_snippets/saving_snippets/snippet_enrichment.png" alt="" align="center" fullwidth="true" />

## Where Saved Snippets Live

Saved snippets are stored locally on your device, ensuring offline accessibility. This also means that any Pieces for Developers extension, plugin, or even the Pieces Desktop App, has constant, up-to-date access to your saved materials with Pieces Drive.

There are two ways to view your saved snippets—by viewing them in your [JetBrains IDE’s sidebar menu](https://docs.pieces.app/products/extensions-plugins/jetbrains/drive/search-reuse#via-pieces-sidebar), or with the [Search Everywhere](https://docs.pieces.app/products/extensions-plugins/jetbrains/drive/search-reuse#finding-saved-snippets) feature.

[Read more about how to find your saved snippets here.](https://docs.pieces.app/products/extensions-plugins/jetbrains/drive/search-reuse#finding-saved-snippets)
