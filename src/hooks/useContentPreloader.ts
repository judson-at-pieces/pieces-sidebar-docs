
import { useEffect } from 'react';
import { contentRegistry } from '@/compiled-content';

export function useContentPreloader() {
  useEffect(() => {
    // Log all available compiled content on app startup
    const availablePaths = Object.keys(contentRegistry);
    console.log('🚀 Content preloader initialized');
    console.log('📚 Available compiled content paths:', availablePaths.length);
    console.log('📋 Paths list:', availablePaths.sort());
    
    // Check for common missing paths
    const expectedPaths = [
      'quick-guides/copilot-with-context',
      'desktop/copilot',
      'extensions-plugins/visual-studio-code/get-started',
      'meet-pieces/windows-installation-guide'
    ];
    
    expectedPaths.forEach(path => {
      if (contentRegistry[path]) {
        console.log(`✅ Found expected path: ${path}`);
      } else {
        console.log(`❌ Missing expected path: ${path}`);
        // Try to find similar paths
        const similar = availablePaths.filter(p => p.includes(path.split('/').pop() || ''));
        if (similar.length > 0) {
          console.log(`🔍 Similar paths found:`, similar);
        }
      }
    });
  }, []);
}
