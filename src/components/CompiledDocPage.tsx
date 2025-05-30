
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCompiledContent, CompiledContentModule, getAllCompiledPaths } from '@/compiled-content';
import { DynamicDocPage } from './DynamicDocPage';

export function CompiledDocPage() {
  const location = useLocation();
  const [compiledContent, setCompiledContent] = useState<CompiledContentModule | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname;
    
    console.log('CompiledDocPage: Current location.pathname:', currentPath);
    
    // Remove /docs prefix and normalize
    const routerPath = currentPath.replace(/^\/docs\//, '').replace(/^\//, '');
    console.log('CompiledDocPage: Router path:', routerPath);
    
    // Get all available paths from compiled content
    const availablePaths = getAllCompiledPaths();
    console.log('CompiledDocPage: Available compiled paths:', availablePaths);
    
    // Find matching content by checking if any compiled path ends with our router path
    let foundContent = null;
    let foundPath = '';
    
    // First try exact match
    const exactPath = `/${routerPath}`;
    foundContent = getCompiledContent(exactPath);
    if (foundContent) {
      foundPath = exactPath;
      console.log('CompiledDocPage: Found exact match:', foundPath);
    } else {
      // Try to find a path that ends with our route
      for (const availablePath of availablePaths) {
        // Check if the available path ends with our router path
        if (availablePath.endsWith(`/${routerPath}`) || availablePath === `/${routerPath}`) {
          foundContent = getCompiledContent(availablePath);
          if (foundContent) {
            foundPath = availablePath;
            console.log('CompiledDocPage: Found matching path:', foundPath, 'for route:', routerPath);
            break;
          }
        }
        
        // Also check for partial matches (e.g., "actions" should match "desktop/actions")
        if (routerPath && availablePath.includes(`/${routerPath}`)) {
          foundContent = getCompiledContent(availablePath);
          if (foundContent) {
            foundPath = availablePath;
            console.log('CompiledDocPage: Found partial match:', foundPath, 'for route:', routerPath);
            break;
          }
        }
      }
      
      // If still no match, try looking for the route as a segment in any path
      if (!foundContent) {
        for (const availablePath of availablePaths) {
          const pathSegments = availablePath.split('/').filter(Boolean);
          if (pathSegments.includes(routerPath)) {
            foundContent = getCompiledContent(availablePath);
            if (foundContent) {
              foundPath = availablePath;
              console.log('CompiledDocPage: Found segment match:', foundPath, 'for route:', routerPath);
              break;
            }
          }
        }
      }
    }
    
    if (foundContent) {
      console.log('CompiledDocPage: Found compiled content at path:', foundPath);
      setCompiledContent(foundContent);
      setShouldUseFallback(false);
    } else {
      console.log('CompiledDocPage: No compiled content found, using fallback for:', currentPath);
      console.log('CompiledDocPage: Tried to match route:', routerPath);
      setShouldUseFallback(true);
    }
  }, [location.pathname]);

  // Use fallback (DynamicDocPage) if no compiled content is available
  if (shouldUseFallback || !compiledContent) {
    return <DynamicDocPage />;
  }

  // Render the compiled content
  const ContentComponent = compiledContent.default;
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex-1 min-w-0">
        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-border">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
            {compiledContent.frontmatter.title}
          </h1>
          {compiledContent.frontmatter.description && (
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4">
              {compiledContent.frontmatter.description}
            </p>
          )}
        </div>

        {/* Compiled content */}
        <div className="markdown-content">
          <ContentComponent />
        </div>
      </div>
    </div>
  );
}
