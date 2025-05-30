
import { useEffect } from 'react';

export function useContentPreloader() {
  useEffect(() => {
    // Content preloader now uses the compiled content system when available
    console.log('Content preloader initialized');
    console.log('Compiled content will be used when available, fallback to dynamic loading');
    
    // The compiled content is already loaded via static imports in the bundle
    // No additional preloading needed for compiled content
  }, []);
}
