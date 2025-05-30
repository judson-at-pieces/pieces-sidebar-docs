
import { useEffect } from 'react';

export function useContentPreloader() {
  useEffect(() => {
    // Content preloader now uses dynamic loading system only
    console.log('Content preloader initialized with dynamic loading system');
    console.log('All content will be loaded dynamically through DynamicDocPage');
    console.log('Static compiled content disabled to prevent TSX parsing errors');
  }, []);
}
