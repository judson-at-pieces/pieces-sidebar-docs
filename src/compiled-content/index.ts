
// Auto-generated content registry
// This file statically imports all compiled content to ensure proper build inclusion

export interface CompiledContentModule {
  default: React.ComponentType<any>;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    lastModified?: string;
    path?: string;
    slug?: string;
  };
}

// Static imports to ensure all content is included in the build
import * as cli_commands from './cli/commands';
import * as cli from './cli';
import * as obsidian_commands from './obsidian/commands';
import * as extensions_plugins_jetbrains_drive from './extensions-plugins/extensions-plugins/jetbrains/drive';
import * as extensions_plugins_jetbrains_commands from './extensions-plugins/extensions-plugins/jetbrains/commands';
import * as extensions_plugins_sublime_commands from './extensions-plugins/extensions-plugins/sublime/commands';
import * as extensions_plugins_vscode_commands from './extensions-plugins/extensions-plugins/visual-studio-code/commands';
import * as extensions_plugins_jupitaleb_commands from './extensions-plugins/extensions-plugins/jupitaleb/commands';
import * as extensions_plugins_jupitaleb_drive_save from './extensions-plugins/extensions-plugins/jupitaleb/drive/save';

// Create the content registry with static mappings
export const contentRegistry: Record<string, CompiledContentModule> = {
  'cli/commands': cli_commands,
  'cli': cli,
  'obsidian/commands': obsidian_commands,
  'extensions-plugins/jetbrains/drive': extensions_plugins_jetbrains_drive,
  'extensions-plugins/jetbrains/commands': extensions_plugins_jetbrains_commands,
  'extensions-plugins/sublime/commands': extensions_plugins_sublime_commands,
  'extensions-plugins/visual-studio-code/commands': extensions_plugins_vscode_commands,
  'extensions-plugins/jupitaleb/commands': extensions_plugins_jupitaleb_commands,
  'extensions-plugins/jupitaleb/drive/save': extensions_plugins_jupitaleb_drive_save,
};

// Add alternative path mappings based on frontmatter
Object.entries(contentRegistry).forEach(([key, module]) => {
  if (module.frontmatter?.path) {
    const frontmatterPath = module.frontmatter.path.replace(/^\//, '');
    if (frontmatterPath !== key) {
      contentRegistry[frontmatterPath] = module;
    }
  }
});

// Export a lookup function
export function getCompiledContent(path: string): CompiledContentModule | null {
  // Normalize the input path
  const normalizedPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  console.log('Looking for compiled content:', normalizedPath);
  console.log('Available paths:', Object.keys(contentRegistry));
  
  // Try exact match first
  if (contentRegistry[normalizedPath]) {
    console.log('Found exact match for:', normalizedPath);
    return contentRegistry[normalizedPath];
  }
  
  // Try with index suffix
  const indexPath = `${normalizedPath}/index`;
  if (contentRegistry[indexPath]) {
    console.log('Found index match for:', indexPath);
    return contentRegistry[indexPath];
  }
  
  console.log('No compiled content found for:', normalizedPath);
  return null;
}

// Export the registry for debugging
export { contentRegistry as debugRegistry };
