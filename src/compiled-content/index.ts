
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

// Dynamic imports for all compiled content - using eager loading to ensure all files are included
const contentModules = import.meta.glob([
  './**/*.tsx',
  './desktop/**/*.tsx',
  './extensions-plugins/**/*.tsx',
  './quick-guides/**/*.tsx',
  './meet-pieces/**/*.tsx'
], { eager: true }) as Record<string, CompiledContentModule>;

// Create a path-to-module mapping
export const contentRegistry: Record<string, CompiledContentModule> = {};

// Process all modules and create normalized path mappings
Object.entries(contentModules).forEach(([filePath, module]) => {
  console.log('Processing compiled content file:', filePath);
  
  // Convert file path to content path
  // ./desktop/download.tsx -> desktop/download
  // ./quick-guides/quick-guides/copilot-with-context.tsx -> quick-guides/copilot-with-context
  let normalizedPath = filePath
    .replace(/^\.\//, '') // Remove leading ./
    .replace(/\.tsx$/, ''); // Remove .tsx extension

  // Handle duplicate directory names (like quick-guides/quick-guides/)
  const pathParts = normalizedPath.split('/');
  if (pathParts.length > 1 && pathParts[0] === pathParts[1]) {
    // Remove the duplicate directory name
    pathParts.splice(1, 1);
    normalizedPath = pathParts.join('/');
  }

  console.log('Registering content at path:', normalizedPath);
  contentRegistry[normalizedPath] = module;
  
  // Also register with frontmatter path if it exists and differs
  if (module.frontmatter?.path) {
    const frontmatterPath = module.frontmatter.path.replace(/^\//, ''); // Remove leading slash
    if (frontmatterPath !== normalizedPath) {
      console.log('Also registering at frontmatter path:', frontmatterPath);
      contentRegistry[frontmatterPath] = module;
    }
  }
});

// Export a lookup function
export function getCompiledContent(path: string): CompiledContentModule | null {
  // Normalize the input path
  const normalizedPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  console.log('Looking for compiled content at path:', normalizedPath);
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
  
  // Try alternative path formats
  const altPaths = [
    normalizedPath.replace(/^([^\/]+)\//, '$1/$1/'), // Add duplicate directory
    normalizedPath.replace(/^([^\/]+)\/([^\/]+)\//, '$1/'), // Remove duplicate directory
  ];
  
  for (const altPath of altPaths) {
    if (contentRegistry[altPath]) {
      console.log('Found alternative match:', altPath, 'for:', normalizedPath);
      return contentRegistry[altPath];
    }
  }
  
  console.log('No compiled content found for:', normalizedPath);
  return null;
}

// Export the registry for debugging
export { contentRegistry as debugRegistry };

// Log all registered content on module load
console.log('Content registry initialized with paths:', Object.keys(contentRegistry));
