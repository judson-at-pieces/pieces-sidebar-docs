
import { useEffect } from 'react';
import { preloadContentIndex } from '@/lib/content';

export function useContentPreloader() {
  useEffect(() => {
    // Preload content index as soon as possible
    preloadContentIndex().catch(error => {
      console.error('Failed to preload content:', error);
    });
  }, []);
}
