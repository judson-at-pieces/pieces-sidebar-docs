
// Auto-generated content registry
// This file dynamically imports all compiled content and exports a registry

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

// Dynamic imports for all compiled content
const contentModules = import.meta.glob('./**/*.tsx', { eager: true }) as Record<string, CompiledContentModule>;

// Create a path-to-module mapping
export const contentRegistry: Record<string, CompiledContentModule> = {};

// Process all modules and create normalized path mappings
Object.entries(contentModules).forEach(([filePath, module]) => {
  // Convert file path to content path
  // ./desktop/download.tsx -> desktop/download
  // ./meet-pieces/windows-installation-guide.tsx -> meet-pieces/windows-installation-guide
  const normalizedPath = filePath
    .replace('.//', '') // Remove leading ./
    .replace('.tsx', '') // Remove .tsx extension
    .replace(/^\.\//, ''); // Remove any remaining ./

  contentRegistry[normalizedPath] = module;
  
  // Also register with frontmatter path if it exists and differs
  if (module.frontmatter?.path) {
    const frontmatterPath = module.frontmatter.path.replace(/^\//, ''); // Remove leading slash
    if (frontmatterPath !== normalizedPath) {
      contentRegistry[frontmatterPath] = module;
    }
  }
});

// Export a lookup function
export function getCompiledContent(path: string): CompiledContentModule | null {
  // Normalize the input path
  const normalizedPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  // Try exact match first
  if (contentRegistry[normalizedPath]) {
    return contentRegistry[normalizedPath];
  }
  
  // Try with index suffix
  const indexPath = `${normalizedPath}/index`;
  if (contentRegistry[indexPath]) {
    return contentRegistry[indexPath];
  }
  
  // For debugging - log available paths
  console.log('Available content paths:', Object.keys(contentRegistry));
  console.log('Requested path:', normalizedPath);
  
  return null;
}

// Export the registry for debugging
export { contentRegistry as debugRegistry };
