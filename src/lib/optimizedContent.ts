
import { ContentPage, loadContentIndex, getContentFromCache } from './content';

// Enhanced cache with TTL and LRU eviction
class OptimizedContentCache {
  private cache = new Map<string, { content: ContentPage; timestamp: number }>();
  private maxSize = 50; // Maximum cached items
  private ttl = 10 * 60 * 1000; // 10 minutes TTL

  get(path: string): ContentPage | null {
    const cached = this.cache.get(path);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(path);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(path);
    this.cache.set(path, cached);
    
    return cached.content;
  }

  set(path: string, content: ContentPage): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(path, {
      content,
      timestamp: Date.now()
    });
  }

  prefetch(paths: string[]): void {
    // Prefetch commonly accessed content
    paths.forEach(async (path) => {
      if (!this.get(path)) {
        const content = getContentFromCache(path);
        if (content) {
          this.set(path, content);
        }
      }
    });
  }
}

const optimizedCache = new OptimizedContentCache();

// Prefetch popular pages
const popularPaths = [
  'getting-started',
  '/docs/getting-started',
  'meet-pieces',
  'desktop',
  'extensions-plugins/visual-studio-code'
];

optimizedCache.prefetch(popularPaths);

export async function loadOptimizedContent(path: string): Promise<ContentPage | null> {
  // Try optimized cache first
  let content = optimizedCache.get(path);
  if (content) return content;

  // Try original cache
  content = getContentFromCache(path);
  if (content) {
    optimizedCache.set(path, content);
    return content;
  }

  // Load from index
  try {
    const index = await loadContentIndex();
    content = index[path] || null;
    if (content) {
      optimizedCache.set(path, content);
    }
    return content;
  } catch (error) {
    console.error('Error loading optimized content:', error);
    return null;
  }
}

export { optimizedCache };
