
import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableOfContents } from './markdown/TableOfContents';
import { ErrorBoundary } from 'react-error-boundary';
import { DynamicDocPage } from './DynamicDocPage';

// Type for compiled content
interface CompiledContent {
  component: React.ComponentType<any>;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    lastModified?: string;
    path?: string;
    slug?: string;
  };
}

// Dynamic import function that tries different path variations
async function loadCompiledContent(path: string): Promise<CompiledContent | null> {
  try {
    console.log(`Attempting to load compiled content for path: ${path}`);
    
    // List of possible path variations to try
    const pathVariations = [
      // Direct path
      path,
      // Handle extensions-plugins double nesting
      path.startsWith('extensions-plugins/') && !path.includes('/extensions-plugins/') 
        ? path.replace('extensions-plugins/', 'extensions-plugins/extensions-plugins/')
        : null,
      // Try with index suffix for directories
      `${path}/index`,
    ].filter(Boolean) as string[];

    for (const tryPath of pathVariations) {
      try {
        console.log(`Trying to load: ${tryPath}`);
        
        // Use dynamic import with template literal
        const module = await import(`@/compiled-content/${tryPath}.tsx`);
        
        if (module.default) {
          console.log(`Successfully loaded compiled content: ${tryPath}`);
          return {
            component: module.default,
            frontmatter: module.frontmatter || {}
          };
        }
      } catch (error) {
        console.log(`Failed to load ${tryPath}:`, error);
        // Continue to next variation
      }
    }
    
    throw new Error(`No compiled content found for: ${path}`);
  } catch (error) {
    console.error('Failed to load compiled content:', error);
    return null;
  }
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-bold mb-4">Content Loading Error</h2>
      <p className="text-muted-foreground mb-4">
        There was an issue loading this documentation page.
      </p>
      <pre className="text-sm text-muted-foreground bg-muted p-4 rounded mb-4">
        {error.message}
      </pre>
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
  const [content, setContent] = useState<CompiledContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function loadContent() {
      if (!path) return;
      
      setLoading(true);
      setError(null);
      setUseFallback(false);
      
      try {
        const compiledContent = await loadCompiledContent(path);
        
        if (compiledContent) {
          setContent(compiledContent);
        } else {
          console.log('Compiled content not found, using fallback to markdown...');
          setUseFallback(true);
        }
      } catch (err) {
        console.error('Error loading content:', err);
        console.log('Using fallback to markdown due to error...');
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
    return <DynamicDocPage />;
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

  const ContentComponent = content.component;
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
