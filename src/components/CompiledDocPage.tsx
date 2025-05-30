
import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableOfContents } from './markdown/TableOfContents';
import { ErrorBoundary } from 'react-error-boundary';
import { DynamicDocPage } from './DynamicDocPage';
import { getCompiledContent, type CompiledContentModule } from '@/compiled-content';

function ErrorFallback({ error }: { error: Error }) {
  console.error('CompiledDocPage error:', error);
  
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-bold mb-4">Content Loading Error</h2>
      <p className="text-muted-foreground mb-4">
        There was an issue loading this documentation page.
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading documentation...</p>
      </div>
    </div>
  );
}

export function CompiledDocPage() {
  const { '*': path } = useParams();
  const [content, setContent] = useState<CompiledContentModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    function loadContent() {
      if (!path) {
        setLoading(false);
        return;
      }
      
      console.log('CompiledDocPage loading path:', path);
      
      setLoading(true);
      setUseFallback(false);
      
      try {
        const compiledContent = getCompiledContent(path);
        
        if (compiledContent && compiledContent.default && typeof compiledContent.default === 'function') {
          console.log('Found compiled content for:', path);
          setContent(compiledContent);
        } else {
          console.log('No valid compiled content found, using fallback for:', path);
          setUseFallback(true);
        }
      } catch (err) {
        console.error('Error loading compiled content:', err);
        setUseFallback(true);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [path]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (useFallback) {
    console.log('Using DynamicDocPage fallback for:', path);
    return <DynamicDocPage />;
  }

  if (!content) {
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

  const ContentComponent = content.default;
  const { frontmatter } = content;
  
  const isGettingStartedPage = path === 'getting-started';
  const shouldShowTOC = false;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          {!isGettingStartedPage && frontmatter.title && (
            <div className="mb-8 pb-6 border-b border-border">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                {frontmatter.title}
              </h1>
              {frontmatter.description && (
                <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-4">
                  {frontmatter.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {frontmatter.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{frontmatter.author}</span>
                  </div>
                )}
                {frontmatter.lastModified && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {new Date(frontmatter.lastModified).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="markdown-content">
            <Suspense fallback={<LoadingSpinner />}>
              <ContentComponent />
            </Suspense>
          </div>
        </div>

        {shouldShowTOC && (
          <div className="order-1 lg:order-2">
            <TableOfContents content="" />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
