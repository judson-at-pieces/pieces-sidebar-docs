
export interface ContentMetadata {
  title: string;
  description?: string;
  order?: number;
  author?: string;
  lastModified?: string;
}

export interface ContentPage {
  slug: string;
  metadata: ContentMetadata;
  content: string;
}

// Content index cache with preloading
let contentIndex: Record<string, ContentPage> | null = null;
let contentIndexPromise: Promise<Record<string, ContentPage>> | null = null;

// Preload content on app startup
export function preloadContentIndex(): Promise<Record<string, ContentPage>> {
  if (contentIndexPromise) {
    return contentIndexPromise;
  }

  contentIndexPromise = (async () => {
    try {
      const response = await fetch('/content-index.json');
      if (!response.ok) {
        console.error('Failed to load content index:', response.status);
        return {};
      }
      
      const data = await response.json();
      contentIndex = data || {};
      return contentIndex;
    } catch (error) {
      console.error('Error loading content index:', error);
      return {};
    }
  })();

  return contentIndexPromise;
}

export async function loadContentIndex(): Promise<Record<string, ContentPage>> {
  if (contentIndex) {
    return contentIndex;
  }
  
  return preloadContentIndex();
}

export async function loadMarkdownContent(path: string): Promise<ContentPage | null> {
  try {
    const index = await loadContentIndex();
    return index[path] || null;
  } catch (error) {
    console.error('Error loading content:', error);
    return null;
  }
}

export function getContentFromCache(path: string): ContentPage | null {
  if (!contentIndex) return null;
  return contentIndex[path] || null;
}

export async function getAllContent(): Promise<ContentPage[]> {
  const index = await loadContentIndex();
  return Object.values(index);
}

// Preload content immediately when this module is imported
preloadContentIndex();
