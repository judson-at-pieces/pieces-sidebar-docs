
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getContentComponent, ContentComponent, contentComponents } from '@/compiled-content';
import { DynamicDocPage } from './DynamicDocPage';

export function CompiledDocPage() {
  const location = useLocation();
  const [compiledContent, setCompiledContent] = useState<ContentComponent | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname;
    
    console.log('CompiledDocPage: Current location.pathname:', currentPath);
    
    // Get all available paths from compiled content registry
    const availablePaths = Object.keys(contentComponents);
    console.log('CompiledDocPage: Available compiled paths:', availablePaths);
    
    // Find matching content by checking multiple strategies
    let foundContent = null;
    let foundPath = '';
    
    // Strategy 1: Exact match
    foundContent = getContentComponent(currentPath);
    if (foundContent) {
      foundPath = currentPath;
      console.log('CompiledDocPage: Found exact match:', foundPath);
    } else {
      // Strategy 2: Try folder path with .md extension (e.g., /cli/copilot -> /cli/copilot.md)
      const pathWithMd = `${currentPath}.md`;
      foundContent = getContentComponent(pathWithMd);
      if (foundContent) {
        foundPath = pathWithMd;
        console.log('CompiledDocPage: Found with .md extension:', foundPath, 'for route:', currentPath);
      } else {
        // Strategy 3: Try different path formats and variations
        const pathVariations = [
          currentPath,
          currentPath.replace(/^\/docs\//, '/'),
          currentPath.replace(/^\//, '/docs/'),
          `/docs${currentPath}`,
          currentPath.replace(/^\/docs/, ''),
          // Add variations with .md extension
          `${currentPath.replace(/^\/docs\//, '/')}.md`,
          `${currentPath.replace(/^\//, '/docs/')}.md`,
          `/docs${currentPath}.md`,
          `${currentPath.replace(/^\/docs/, '')}.md`,
        ].filter((path, index, arr) => arr.indexOf(path) === index); // Remove duplicates
        
        console.log('CompiledDocPage: Trying path variations:', pathVariations);
        
        for (const variation of pathVariations) {
          foundContent = getContentComponent(variation);
          if (foundContent) {
            foundPath = variation;
            console.log('CompiledDocPage: Found variation match:', foundPath, 'for route:', currentPath);
            break;
          }
        }
        
        // Strategy 4: Try to match segments using registry keys
        if (!foundContent) {
          const registryKeys = Object.keys(contentComponents);
          for (const registryPath of registryKeys) {
            const currentSegments = currentPath.split('/').filter(Boolean);
            const availableSegments = registryPath.split('/').filter(Boolean);
            
            // Check if the paths match when normalized (with or without .md)
            const normalizedCurrent = currentPath.replace(/\.md$/, '');
            const normalizedRegistry = registryPath.replace(/\.md$/, '');
            
            if (normalizedCurrent === normalizedRegistry) {
              foundContent = getContentComponent(registryPath);
              if (foundContent) {
                foundPath = registryPath;
                console.log('CompiledDocPage: Found normalized match:', foundPath, 'for route:', currentPath);
                break;
              }
            }
            
            // Check if the last segment matches
            if (currentSegments.length > 0 && availableSegments.length > 0 && 
                currentSegments[currentSegments.length - 1] === availableSegments[availableSegments.length - 1]) {
              foundContent = getContentComponent(registryPath);
              if (foundContent) {
                foundPath = registryPath;
                console.log('CompiledDocPage: Found segment match:', foundPath, 'for route:', currentPath);
                break;
              }
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
  const ContentComponent = compiledContent.component;
  
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
