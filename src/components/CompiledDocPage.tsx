
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCompiledContent, CompiledContentModule, contentRegistry } from '@/compiled-content';
import { DynamicDocPage } from './DynamicDocPage';

export function CompiledDocPage() {
  const location = useLocation();
  const [compiledContent, setCompiledContent] = useState<CompiledContentModule | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname;
    
    console.log('CompiledDocPage: Current location.pathname:', currentPath);
    
    // Get all available paths from compiled content registry
    const availablePaths = Object.keys(contentRegistry);
    console.log('CompiledDocPage: Available compiled paths:', availablePaths);
    
    // Find matching content by checking multiple strategies
    let foundContent = null;
    let foundPath = '';
    
    // Strategy 1: Exact match
    foundContent = getCompiledContent(currentPath);
    if (foundContent) {
      foundPath = currentPath;
      console.log('CompiledDocPage: Found exact match:', foundPath);
    } else {
      // Strategy 2: Try different path formats
      const pathVariations = [
        currentPath,
        currentPath.replace(/^\/docs\//, '/'),
        currentPath.replace(/^\//, '/docs/'),
        `/docs${currentPath}`,
        currentPath.replace(/^\/docs/, ''),
      ].filter((path, index, arr) => arr.indexOf(path) === index); // Remove duplicates
      
      for (const variation of pathVariations) {
        foundContent = getCompiledContent(variation);
        if (foundContent) {
          foundPath = variation;
          console.log('CompiledDocPage: Found variation match:', foundPath, 'for route:', currentPath);
          break;
        }
      }
      
      // Strategy 3: Try to match segments
      if (!foundContent) {
        for (const availablePath of availablePaths) {
          const currentSegments = currentPath.split('/').filter(Boolean);
          const availableSegments = availablePath.split('/').filter(Boolean);
          
          // Check if the last segment matches
          if (currentSegments.length > 0 && availableSegments.length > 0 && 
              currentSegments[currentSegments.length - 1] === availableSegments[availableSegments.length - 1]) {
            foundContent = getCompiledContent(availablePath);
            if (foundContent) {
              foundPath = availablePath;
              console.log('CompiledDocPage: Found segment match:', foundPath, 'for route:', currentPath);
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
