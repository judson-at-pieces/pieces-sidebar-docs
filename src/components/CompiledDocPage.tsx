
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCompiledContent, CompiledContentModule } from '@/compiled-content';
import { DynamicDocPage } from './DynamicDocPage';

export function CompiledDocPage() {
  const location = useLocation();
  const [compiledContent, setCompiledContent] = useState<CompiledContentModule | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname;
    
    console.log('CompiledDocPage: Current location.pathname:', currentPath);
    
    // Try multiple path variations to find the content
    const pathsToTry = [
      currentPath, // exact path
      currentPath.startsWith('/docs/') ? currentPath : `/docs${currentPath}`, // add /docs prefix if missing
      currentPath.replace(/\/+/g, '/'), // clean up double slashes
    ];
    
    // If path doesn't start with /docs/, also try it with /docs/ prefix
    if (!currentPath.startsWith('/docs/')) {
      pathsToTry.push(`/docs${currentPath}`);
    }
    
    console.log('CompiledDocPage: Trying paths:', pathsToTry);
    
    let foundContent = null;
    let foundPath = '';
    
    for (const tryPath of pathsToTry) {
      const content = getCompiledContent(tryPath);
      if (content) {
        foundContent = content;
        foundPath = tryPath;
        break;
      }
    }
    
    if (foundContent) {
      console.log('CompiledDocPage: Found compiled content at path:', foundPath);
      setCompiledContent(foundContent);
      setShouldUseFallback(false);
    } else {
      console.log('CompiledDocPage: No compiled content found, using fallback for:', currentPath);
      console.log('CompiledDocPage: Available paths in registry:', Object.keys(getCompiledContent.registry || {}));
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
