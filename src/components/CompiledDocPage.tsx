
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCompiledContent, CompiledContentModule } from '@/compiled-content';
import { DynamicDocPage } from './DynamicDocPage';

export function CompiledDocPage() {
  const { '*': path } = useParams();
  const [compiledContent, setCompiledContent] = useState<CompiledContentModule | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  useEffect(() => {
    if (!path) {
      setShouldUseFallback(true);
      return;
    }

    // Clean up the path - remove any double slashes and normalize
    let normalizedPath = path.replace(/\/+/g, '/');
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    
    // Ensure it starts with /docs/ if it doesn't already
    if (!normalizedPath.startsWith('/docs/')) {
      normalizedPath = `/docs${normalizedPath}`;
    }
    
    // Clean up any double slashes again
    normalizedPath = normalizedPath.replace(/\/+/g, '/');
    
    console.log('CompiledDocPage: Looking for compiled content at:', normalizedPath);
    
    const content = getCompiledContent(normalizedPath);
    
    if (content) {
      console.log('CompiledDocPage: Found compiled content for:', normalizedPath);
      setCompiledContent(content);
      setShouldUseFallback(false);
    } else {
      console.log('CompiledDocPage: No compiled content found, using fallback for:', normalizedPath);
      setShouldUseFallback(true);
    }
  }, [path]);

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
