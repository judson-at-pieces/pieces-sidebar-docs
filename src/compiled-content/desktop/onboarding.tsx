import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Get Started with the Pieces Desktop App",
  "path": "/desktop/onboarding",
  "visibility": "PUBLIC"
};

const markdownContent = `***

## First Contact

When you first launch the Pieces Desktop App, you can choose from \`Light\` or \`Dark\` theme modes to suit your preferences; otherwise, this mode is tied to your system's preferences and will change periodically.

You can also decide if you want to share *anonymous crash data* to help improve the product.

A \`Get Started\` button takes you into the onboarding process.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/revised_step_1.png" alt="" align="center" fullwidth="false" />

### Cloud Accounts & Integrations

This step includes an option to sign in with GitHub or Google to import code Gists and relevant data, or skip cloud integration and stay local if that suits you better.

Pieces for Developers stores developer materials locally and allows you to share them with anyone you’d like.

Signing in enables you to store snippets and backups in **Pieces Cloud**.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/revised_login_page.png" alt="" align="center" fullwidth="false" />

## The Magic Moment

Once past the **Cloud Accounts & Integrations** screen, you’ll be launched into the default Pieces Desktop App view, which is the **Workstream Activity View.**

From here, you can follow the guided, interactive Long-Term Memory demo and experience your first *Magic Moment.*

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/step_2_gif.gif" alt="" align="center" fullwidth="false" />

All you need to do is proceed with your workflow for 10-15 minutes while the [Long-Term Memory Engine (LTM-2)](https://docs.pieces.app/products/core-dependencies/pieces-os#ltm-2) captures memories—then, we’ll show you how to use it with Pieces Copilot.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/step_3_completed_workflow_memories_gathering.png" alt="" align="center" fullwidth="false" />

### Workstream Activity Summaries

Now that you've successfully captured over 30 memories using the LTM, it's time for you to check out your summary to see how future summaries will appear.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/new_workstream.png" alt="" align="center" fullwidth="false" />

These summaries include helpful links to collaboration-focused documents, reference conversations with coworkers you've participated in, provide links to articles you've mentioned, and show GitHub PRs or Jira tickets you've opened, among other things.

From this point, you’ll see a highlighted button in the top-right corner of the Pieces Desktop App—this is where you can control LTM Engine Access Settings, which controls what applications Pieces is allowed to pull workflow context from.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/step_4_ltmsource_powermenu_piecescopilot.gif" alt="" align="center" fullwidth="false" />

You’ll also be introduced to the **Power Menu**, from which you can access the Pieces Copilot view—that's where you’ll be headed next.

### Pieces Copilot + LTM

[LTM](https://docs.pieces.app/products/core-dependencies/pieces-os#ltm-2) captures and stores workflow context in the [Pieces Drive](https://docs.pieces.app/products/core-dependencies/pieces-os#pieces-drive). You can visit a site like Stack Overflow, read code explanations, and later query Pieces Copilot about what you read.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/step_5_pieces_copilot_view.png" alt="" align="center" fullwidth="false" />

By enabling LTM, you can use Pieces Copilot as an AI assistant trained on your personal workflow data, all of which is kept on-device.

<Callout type="info">
  Read more about [data collection and storage.](https://docs.pieces.app/products/core-dependencies/on-device-storage)
</Callout>

Clicking the flashing button that reads *“Generate a stand-up styled summary of my recent work”* to have Pieces Copilot use LTM data to generate an output of what you did during the memory-capturing process.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/desktop_app_assets/onboarding/second_rv_pfd_onboarding/generating_from_context_and_changing_model.gif" alt="" align="center" fullwidth="false" />

You can also see the flashing LLM selector in the bottom-left corner of the app. This is where you’ll swap between cloud-hosted LLMs and local, on-device models, powered by [Ollama](https://docs.pieces.app/products/core-dependencies/ollama)—an optional dependency.

## Additional Documentation

That’s it! You’ve completed the Pieces onboarding and are ready to start exploring the app and discovering how to utilize the features and functionalities of the Pieces ecosystem in your daily workflow.

If you want to read more, click the links below to jump to additional documentation:

* [Pieces Copilot](https://docs.pieces.app/products/desktop/copilot)—Ask technical questions, create code snippets, get help with debugging, and receive insights—all in a chat format you know.

* [Pieces Drive](https://docs.pieces.app/products/desktop/drive)—Save, access, edit, and reuse materials saved to the Pieces Drive.

* [Workstream Activity](https://docs.pieces.app/products/desktop/workstream-activity)—View incremental workflow summaries, saved context, and related information gathered by the Long-Term Memory (LTM-2) Engine.

* [Navigation](https://docs.pieces.app/products/desktop/navigation)—Learn the different views and layouts in the Pieces Desktop App and discover the Power Menu.

* [Configuration](https://docs.pieces.app/products/desktop/configuration)—Customize everything from visuals and aesthetics to Pieces Drive enrichment and Pieces Copilot models to fit your preferences and workflow.

* [Actions & Keyboard Shortcuts](https://docs.pieces.app/products/desktop/actions)—Use Power Menu Actions and Keyboard Shortcuts to perform tasks or navigate from view to view quickly.

* [Troubleshooting](https://docs.pieces.app/products/desktop/troubleshooting)—If the Pieces Desktop App isn't working as expected, start here. This page explains our troubleshooting documentation and guides you to the solution that best addresses your issue.
`;

export default function MDX_desktop_onboarding() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_desktop_onboarding.displayName = 'MDX_desktop_onboarding';
MDX_desktop_onboarding.frontmatter = frontmatter;
