import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Transforming & Translating Code",
  "path": "/desktop/drive/transforming-code",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## Use Cases

As you expand your snippet library, you may find situations where a snippet needs to be adapted for a new project or platform.

Instead of rewriting the snippet from scratch, you can harness Pieces Drive’s transformation options.

These transformations let you quickly produce alternative versions, making your code more maintainable and shareable across different scenarios.

This is useful for:

* **Rapid Prototyping:** Spin up new, specialized versions of a snippet in seconds.

* **Code Reuse:** Save time by leveraging existing logic and adjusting it to new requirements (e.g., different language, more performant).

* **Collaboration:** Provide colleagues with multiple snippet variations—like a simpler ‘readable’ version and a separate ‘optimized’ version.

## How To Transform Code

There are two ways to access the code transformation feature within the Pieces Drive view.

### via Add Materials Button

By clicking the white \`‘+’ icon\` in the bottom left of the Pieces Drive view—also known as the *Add Materials* button—you can click \`Duplicate Current\`, which accesses the currently-viewed saved material and provides several different options for transformation.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/pieces_drive/transforming_code/ss_duplicate_snippet_modal.png" alt="" align="center" fullwidth="true" />

### via Quick Menu

You can also access the code transformation menu through the **Detailed View**, which is the modal containing all of the saved material’s enriched metadata—[which you can read more about here.](https://docs.pieces.app/products/desktop/drive/enrichment-and-metadata)

To do so, open the **Quick Menu** by clicking the **three vertical dots** on the right side of the *Focused Snippet* view, and select \`Duplicate\` to trigger the same code transformation modal.

## Transformation Types

The first option is called **Non-Modified** and lets you create an exact duplicate of the in-focus saved material, in case you want to save a copy and make experimental edits and other changes without losing the original material.

There are four following options:

***

| **Type**               | **Purpose**                                                                          | **Use Case**                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| *More Readable*        | Create a more-readable copy that’s more understandable to others.                    | Useful for working with junior developers or sharing a snippet with non-developer stakeholders.                               |
| *More Performant*      | Create a more performance-optimized copy that utilizes less computational resources. | Perfect for code that needs to handle larger workloads or run more efficiently in production.                                 |
| *Boilerplate Template* | Create a copy that can be used as a template for future workflows.                   | Great for starting new projects quickly using a proven pattern or code structure.                                             |
| *Different Language*   | Create a version using a different programming language.                             | Essential for integrating logic in another language or exploring a different tech stack without rewriting the entire snippet. |

***

## Post-Transformation Management

Each transformation results in a brand-new material in your Pieces Drive.

This new saved material is immediately re-enriched as if it was a brand new material:

* **Auto-Generated Title:** Often describing the type of transformation applied—e.g., *Optimized Python Script For Parsing Data* or another such title.

* **Tags & Annotations:** If relevant, Pieces may retain or revise tags based on the snippet’s updated content.

* **Captured Context:** The snippet will record its transformation history, so you know it originated from another piece of code.

You can further refine the newly created material by [renaming it, adding or removing tags, editing annotations, and more.](https://docs.pieces.app/products/desktop/drive/enrichment-and-metadata#renaming-and-reclassifying)
`;

export default function MDX_desktop_drive_transforming_code() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_drive_transforming_code.displayName = 'MDX_desktop_drive_transforming_code';
MDX_desktop_drive_transforming_code.frontmatter = frontmatter;
