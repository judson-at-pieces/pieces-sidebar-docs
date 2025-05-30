
import { useEffect } from 'react';

export function useContentPreloader() {
  useEffect(() => {
    // Simple content preloader that just logs initialization
    // This ensures the compiled content is loaded when the app starts
    try {
      // Import the content registry to trigger loading
      import('@/compiled-content').then((module) => {
        const availablePaths = Object.keys(module.contentRegistry || {});
        console.log('Content preloader initialized with', availablePaths.length, 'pages');
      }).catch(() => {
        console.log('Content preloader: compiled content not available');
      });
    } catch (error) {
      console.log('Content preloader: initialization failed');
    }
  }, []);
}
