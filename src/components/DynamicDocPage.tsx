
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import HashnodeMarkdownRenderer from './markdown/HashnodeMarkdownRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';
import { loadMarkdownContent, getContentFromCache, ContentPage } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableOfContents } from './markdown/TableOfContents';

export function DynamicDocPage() {
  const { '*': path } = useParams();
  const location = useLocation();
  const [content, setContent] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      // Get the current path from location if path param is empty
      const basePath = location.pathname;
      const subPath = path;
      
      console.log('DynamicDocPage: path param:', path, 'location.pathname:', location.pathname);
      
      if (!basePath) return;
      
      // Try multiple path variations to find content
      const pathVariations = [
        // First try with /docs prefix (this is how content is stored in index)
        basePath.startsWith('/docs/') ? basePath : `/docs${basePath}`,
        // Then try the original path
        basePath,
        // For getting-started, use the direct path without /docs/ prefix
        basePath === '/getting-started' || basePath === 'getting-started' ? 'getting-started' : null,
        // Remove leading slash and add /docs
        basePath.replace(/^\//, '/docs/'),
        // Also try without leading slash entirely
        basePath.replace(/^\//, ''),
      ].filter(Boolean);
      
      console.log('DynamicDocPage: trying path variations:', pathVariations);
      
      // Try to get content from cache first (synchronous)
      let foundContent = null;
      let foundPath = '';
      
      for (const variation of pathVariations) {
        const cachedContent = getContentFromCache(variation);
        if (cachedContent) {
          foundContent = cachedContent;
          foundPath = variation;
          console.log('DynamicDocPage: Found cached content for:', variation);
          break;
        }
      }
      
      if (foundContent) {
        setContent(foundContent);
        setLoading(false);
        setError(null);
        return;
      }
      
      // If not in cache, show loading and fetch
      setLoading(true);
      setError(null);
      
      try {
        // Try each path variation until we find content
        for (const variation of pathVariations) {
          console.log('Attempting to load content for path:', variation);
          
          const contentPage = await loadMarkdownContent(variation);
          if (contentPage) {
            console.log('Content loaded successfully:', contentPage.metadata.title);
            setContent(contentPage);
            setLoading(false);
            setError(null);
            return;
          }
        }
        
        console.log('No content found for any path variation');
        setError('Content not found');
      } catch (err) {
        console.error('Error loading content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [path, location.pathname]);

  // Only show loading if we're actually loading and don't have content yet
  if (loading && !content) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The documentation page you're looking for doesn't exist.
        </p>
        <Link to="/docs">
          <Button>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Documentation
          </Button>
        </Link>
      </div>
    );
  }

  console.log('Rendering DynamicDocPage with content:', content.metadata.title);

  // Check if this is the getting-started page
  const isGettingStartedPage = path === 'getting-started';
  
  // Show TOC only if it's not the getting-started page and content has headings
  const shouldShowTOC = !isGettingStartedPage && content.content.includes('#');

  // Check if content should use HashnodeMarkdownRenderer
  const shouldUseHashnodeRenderer = content.content.includes('***') || 
    content.content.includes('<Accordion') || 
    content.content.includes('<AccordionGroup') ||
    content.content.includes('<CardGroup') ||
    content.content.includes('<Steps') ||
    content.content.includes('<Callout') ||
    content.content.includes('<Card ') ||
    content.content.includes('<Image');

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Main content */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        {/* Page header - hide for getting-started page */}
        {!isGettingStartedPage && (
          <div className="mb-8 pb-6 border-b border-border">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">{content.metadata.title}</h1>
            {content.metadata.description && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4">{content.metadata.description}</p>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {content.metadata.author && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{content.metadata.author}</span>
                </div>
              )}
              {content.metadata.lastModified && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {new Date(content.metadata.lastModified).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content with appropriate renderer */}
        <div className="max-w-none">
          {shouldUseHashnodeRenderer ? (
            <>
              {console.log('DynamicDocPage: Using HashnodeMarkdownRenderer for content with special components', content.metadata.title)}
              <HashnodeMarkdownRenderer content={content.content} />
            </>
          ) : (
            <>
              {console.log('DynamicDocPage: Using MarkdownRenderer for standard content', content.metadata.title)}
              <div className="hn-markdown-renderer">
                <MarkdownRenderer content={content.content} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table of Contents - only show when appropriate */}
      {shouldShowTOC && (
        <div className="order-1 lg:order-2">
          <TableOfContents content={content.content} />
        </div>
      )}
    </div>
  );
}
