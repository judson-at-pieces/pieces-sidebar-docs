
import { useEffect } from 'react';
import { contentRegistry } from '@/compiled-content';

export function useContentPreloader() {
  useEffect(() => {
    // Log the available compiled content for debugging
    const availablePaths = Object.keys(contentRegistry);
    console.log('Content preloader initialized with', availablePaths.length, 'compiled pages');
    console.log('Available compiled paths:', availablePaths);
    
    // Verify content modules are properly loaded
    const validModules = availablePaths.filter(path => {
      const module = contentRegistry[path];
      return module && typeof module.default === 'function' && module.frontmatter;
    });
    
    console.log('Valid compiled modules:', validModules.length);
    if (validModules.length !== availablePaths.length) {
      console.warn('Some compiled modules may be invalid');
    }
  }, []);
}
