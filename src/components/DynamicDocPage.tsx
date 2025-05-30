import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MarkdownRenderer } from './MarkdownRenderer';
import { loadMarkdownContent, ContentPage } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableOfContents } from './markdown/TableOfContents';

export function DynamicDocPage() {
  const { '*': path } = useParams();
  const [content, setContent] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      if (!path) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // For getting-started, use the direct path without /docs/ prefix
        const contentPath = path === 'getting-started' ? 'getting-started' : `/docs/${path}`;
        console.log('Attempting to load content for path:', contentPath);
        
        const contentPage = await loadMarkdownContent(contentPath);
        console.log('Loaded content page:', contentPage);
        
        if (contentPage) {
          console.log('Content loaded successfully:', contentPage.metadata.title);
          console.log('Content preview:', contentPage.content.substring(0, 200));
          console.log('Full content length:', contentPage.content.length);
          setContent(contentPage);
        } else {
          console.log('No content found for path:', contentPath);
          setError('Content not found');
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [path]);

  if (loading) {
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

  return (
    <div className="max-w-7xl mx-auto flex gap-8">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Page header - hide for getting-started page */}
        {!isGettingStartedPage && (
          <div className="mb-8 pb-6 border-b border-border">
            <h1 className="text-4xl font-bold mb-2">{content.metadata.title}</h1>
            {content.metadata.description && (
              <p className="text-xl text-muted-foreground mb-4">{content.metadata.description}</p>
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

        {/* Content */}
        <div className="markdown-content">
          <MarkdownRenderer content={content.content} />
        </div>
      </div>

      {/* Table of Contents - only show when appropriate */}
      {shouldShowTOC && <TableOfContents content={content.content} />}
    </div>
  );
}
