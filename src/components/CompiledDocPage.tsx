import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableOfContents } from './markdown/TableOfContents';
import { ErrorBoundary } from 'react-error-boundary';

// Type for compiled content
interface CompiledContent {
  component: React.ComponentType<any>;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    lastModified?: string;
    path?: string;
    slug?: string; // Custom URL slug that overrides default path-based routing
  };
}

// Slug mapping cache
let slugToPathMapping: Map<string, string> | null = null;

// Build slug mapping from all compiled content
async function buildSlugMapping(): Promise<Map<string, string>> {
  if (slugToPathMapping) return slugToPathMapping;
  
  const mapping = new Map<string, string>();
  
  // Import the index file that contains all available paths
  try {
    const index = await import('../compiled-content/index.ts');
    const allPaths = index.allContentPaths || [];
    
    // For each path, try to load its frontmatter to check for custom slug
    for (const filePath of allPaths) {
      try {
        const module = await import(/* @vite-ignore */ `../compiled-content/${filePath}.tsx`);
        const frontmatter = module.frontmatter || {};
        
        if (frontmatter.slug) {
          // Map custom slug to file path
          mapping.set(frontmatter.slug, filePath);
        }
      } catch (error) {
        // Skip files that can't be loaded
        continue;
      }
    }
  } catch (error) {
    console.warn('Could not load content index for slug mapping:', error);
  }
  
  slugToPathMapping = mapping;
  return mapping;
}

// Dynamic import function
async function loadCompiledContent(path: string): Promise<CompiledContent | null> {
  try {
    // First, check if this path matches a custom slug
    const slugMapping = await buildSlugMapping();
    const customPath = slugMapping.get(path);
    
    if (customPath) {
      try {
        console.log(`Found custom slug mapping: ${path} -> ${customPath}`);
        const module = await import(/* @vite-ignore */ `../compiled-content/${customPath}.tsx`);
        
        return {
          component: module.default,
          frontmatter: module.frontmatter || {}
        };
      } catch (error) {
        console.warn(`Failed to load content from custom slug mapping: ${customPath}`, error);
        // Fall through to standard path resolution
      }
    }
    
    const pathSegments = path.split('/');
    
    // Try multiple path resolution strategies
    const pathsToTry = [];
    
    // Strategy 1: Handle special cases first
    if (path === 'getting-started') {
      pathsToTry.push('getting-started');
    }
    
    // Strategy 2: Direct path mapping
    pathsToTry.push(path);
    
    // Strategy 3: For 2+ segment paths, try the nested duplicate pattern
    // e.g., "quick-guides/overview" -> "quick-guides/quick-guides/overview"
    // e.g., "mcp/cursor" -> "mcp/mcp/cursor"
    if (pathSegments.length >= 2) {
      const [firstSegment, ...rest] = pathSegments;
      pathsToTry.push(`${firstSegment}/${firstSegment}/${rest.join('/')}`);
    }
    
    // Strategy 4: For single segment paths, try adding the duplicate
    // e.g., "quick-guides" -> "quick-guides/quick-guides"
    if (pathSegments.length === 1) {
      pathsToTry.push(`${path}/${path}`);
    }
    
    // Strategy 5: Handle nested extension patterns
    // e.g., "extensions-plugins/jetbrains" -> "extensions-plugins/extensions-plugins/jetbrains"
    if (pathSegments.length >= 2 && pathSegments[0] === 'extensions-plugins') {
      const [first, ...rest] = pathSegments;
      pathsToTry.push(`${first}/${first}/${rest.join('/')}`);
    }
    
    // Strategy 6: Handle LLM models paths
    // e.g., "large-language-models/cloud-models" -> "large-language-models/cloud-models"
    if (pathSegments.length >= 2 && pathSegments[0] === 'large-language-models') {
      // These don't need the duplicate pattern, just direct mapping
      pathsToTry.unshift(path);
    }
    
    // Try each path until one works
    for (const fileName of pathsToTry) {
      try {
        console.log(`Trying to load: ${fileName}.tsx`);
        const module = await import(/* @vite-ignore */ `../compiled-content/${fileName}.tsx`);
        
        return {
          component: module.default,
          frontmatter: module.frontmatter || {}
        };
      } catch (innerError) {
        // Continue to next path strategy
        console.log(`Failed to load ${fileName}.tsx:`, innerError.message);
        continue;
      }
    }
    
    throw new Error(`No valid path found for: ${path}`);
  } catch (error) {
    console.error('Failed to load compiled content:', error);
    return null;
  }
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
      <pre className="text-sm text-muted-foreground">{error.message}</pre>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading content...</p>
      </div>
    </div>
  );
}

export function CompiledDocPage() {
  const { '*': path } = useParams();
  const [content, setContent] = useState<CompiledContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      if (!path) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const compiledContent = await loadCompiledContent(path);
        
        if (compiledContent) {
          setContent(compiledContent);
        } else {
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
    return <LoadingSpinner />;
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
  
  // Check if this is the getting-started page
  const isGettingStartedPage = path === 'getting-started';
  
  // For TOC, we'd need to extract headings from the rendered content
  // This is more complex with compiled components, so we'll skip it for now
  const shouldShowTOC = false;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          {/* Page header - hide for getting-started page */}
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
              
              {/* Metadata */}
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

          {/* Content */}
          <div className="markdown-content">
            <Suspense fallback={<LoadingSpinner />}>
              <ContentComponent />
            </Suspense>
          </div>
        </div>

        {/* Table of Contents - disabled for compiled content */}
        {shouldShowTOC && (
          <div className="order-1 lg:order-2">
            <TableOfContents content="" />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}