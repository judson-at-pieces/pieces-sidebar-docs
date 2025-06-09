
// Compiled content registry
export interface ContentComponent {
  component: React.ComponentType;
  frontmatter: {
    title: string;
    description?: string;
    path?: string;
    visibility?: string;
    [key: string]: any;
  };
}

export const contentComponents: Record<string, ContentComponent> = {};

export function getContentComponent(path: string): ContentComponent | null {
  return contentComponents[path] || null;
}

export function registerContent(path: string, component: ContentComponent) {
  contentComponents[path] = component;
}
