---
title: "Commands"
path: "/cli/commands"
visibility: "PUBLIC"
---
***
# Edit
## Pieces CLI Commands

Below is a table containing all the commands available for use in the Pieces CLI.

<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/commands/pieces_help.png" alt="" align="center" fullwidth="true" />

### Command Table

You can easily access these commands through the **help menu** using the command `help` within the Pieces CLI. If you’re not within the Pieces CLI, you can use `pieces help`.

When you’re within the terminal and use the `pieces run` command, you don’t have to prefix the commands with “pieces”.

| Command                           | What it does                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `run`                             | Start the CLI in loop mode—you only need to type flags or commands.                               |
| `list`                            | List all materials in your Pieces Drive (alias: `drive`).                                         |
| `list apps`                       | List all registered applications.                                                                 |
| `list models`                     | List available AI models and switch which one `ask` uses.                                         |
| `create`                          | Create a new material from whatever’s on your clipboard.                                          |
| `modify`                          | Update the content of the current material.                                                       |
| `edit`                            | Change the name or classification of the current material.                                        |
| `delete`                          | Delete the current (or most recent) material.                                                     |
| `execute`                         | Run a Pieces bash material.                                                                       |
| `clear`                           | Clear the terminal screen.                                                                        |
| `config`                          | Show your current Pieces CLI configuration.                                                       |
| `config --editor <editorName>`    | Set your preferred code editor (e.g. `vim`, `code`).                                              |
| `install`                         | Install the PiecesOS desktop application.                                                         |
| `open`                            | Open PiecesOS or its helper Applet.                                                               |
| `ask "Your question here"`        | Send a question to the AI.                                                                        |
| `-m`, `--materials <id1> <id2> …` | Attach saved items by index (e.g. `-m 1 2`).                                                      |
| `-f`, `--file <path1> <path2> …`  | Attach files or folders (absolute or relative paths).                                             |
| `chats`                           | List all your past conversations.                                                                 |
| `chat`                            | Show messages in your current conversation.                                                       |
| `chat <number>`                   | Switch to and display a specific conversation by its number.                                      |
| `-n`                              | Start a new conversation.                                                                         |
| `-d`                              | Delete the conversation you’re currently in.                                                      |
| `-r <new name>`                   | Rename your current conversation (e.g. `-r "Project Ideas"`).                                     |
| `search <query>`                  | Fuzzy-search your materials and chats.                                                            |
| `--mode ncs`                      | Use Neural Code Search for your query.                                                            |
| `--mode fts`                      | Use Full-Text Search for your query.                                                              |
| `commit`                          | Commit changes to GitHub and auto-generate the message. Add `-p` or `--push` to push immediately. |
| `login`                           | Log in to your Pieces Cloud account.                                                              |
| `logout`                          | Log out of your Pieces Cloud account.                                                             |
| `version`                         | Show versions of PiecesOS and the CLI tool.                                                       |
| `help`                            | Display the help message.                                                                         |
| `onboarding`                      | Walk through the initial setup process.                                                           |
| `feedback`                        | Send feedback directly to the Pieces team.                                                        |
| `contribute`                      | Contribute code or ideas to the CLI project.                                                      |
