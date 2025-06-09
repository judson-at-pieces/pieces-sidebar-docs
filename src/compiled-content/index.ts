
// Basic compiled content module to prevent import errors
// This serves as a fallback when the MDX compiler hasn't run yet

export interface ContentComponent {
  component: React.ComponentType;
  frontmatter: {
    title: string;
    description?: string;
    path?: string;
    [key: string]: any;
  };
}

// Empty registry that will be populated by the MDX compiler
export const contentComponents: Record<string, ContentComponent> = {};

// Helper function to get content component by path
export function getContentComponent(path: string): ContentComponent | null {
  return contentComponents[path] || null;
}

// Export for compatibility
export default {
  contentComponents,
  getContentComponent
};
