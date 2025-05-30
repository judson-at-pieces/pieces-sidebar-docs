
// Compiled content system for faster loading
// Content is pre-compiled at build time to avoid runtime markdown parsing

export interface CompiledContentModule {
  default: React.ComponentType;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    lastModified?: string;
    path?: string;
    visibility?: string;
  };
}

// Content registry will be populated by the build script
// This ensures all content is included in the bundle at build time
export const contentRegistry: Record<string, CompiledContentModule> = {};

// Function to get compiled content from registry
export function getCompiledContent(path: string): CompiledContentModule | null {
  // Normalize the path to match registry keys
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return contentRegistry[normalizedPath] || null;
}

// Register content function (used by build script)
export function registerContent(path: string, module: CompiledContentModule): void {
  contentRegistry[path] = module;
}
