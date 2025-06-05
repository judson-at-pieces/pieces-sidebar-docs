
export async function loadMdxContent(path: string) {
  try {
    // Remove leading slash and .md extension if present
    const cleanPath = path.replace(/^\//, '').replace(/\.md$/, '');
    
    // Try to load the compiled content
    const module = await import(`../compiled-content/${cleanPath}.tsx`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load MDX content for path: ${path}`, error);
    return null;
  }
}

export function getContentPath(href: string): string {
  // Remove leading slash and ensure we have a clean path
  const cleanPath = href.replace(/^\//, '');
  
  // For paths that end with a folder name but should load the index file
  // e.g., '/extensions-plugins/jetbrains/copilot' should load 'extensions-plugins/jetbrains/copilot.md'
  return cleanPath;
}

export function normalizeNavigationPath(path: string): string {
  // Normalize the path by removing leading/trailing slashes
  return path.replace(/^\/+|\/+$/g, '');
}
