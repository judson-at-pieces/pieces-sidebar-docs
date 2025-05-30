
// Compiled content system disabled to prevent TSX parsing errors
// All content is loaded dynamically through DynamicDocPage

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

// Empty registry - no compiled content
export const contentRegistry: Record<string, CompiledContentModule> = {};

// Always return null to force fallback to DynamicDocPage
export function getCompiledContent(_path: string): CompiledContentModule | null {
  return null;
}
