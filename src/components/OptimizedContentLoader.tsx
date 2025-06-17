
import { memo, Suspense, lazy } from 'react';
import { ContentPage } from '@/lib/content';

// Lazy load markdown renderers for better performance
const HashnodeMarkdownRenderer = lazy(() => import('./markdown/HashnodeMarkdownRenderer'));
const MarkdownRenderer = lazy(() => import('./MarkdownRenderer').then(module => ({ default: module.MarkdownRenderer })));

interface OptimizedContentLoaderProps {
  content: ContentPage;
  isGettingStartedPage?: boolean;
}

const ContentLoadingSkeleton = memo(() => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-muted rounded w-3/4"></div>
    <div className="h-4 bg-muted rounded w-full"></div>
    <div className="h-4 bg-muted rounded w-5/6"></div>
    <div className="h-4 bg-muted rounded w-4/5"></div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-3/4"></div>
    </div>
  </div>
));

ContentLoadingSkeleton.displayName = 'ContentLoadingSkeleton';

const OptimizedContentLoader = memo(({ content, isGettingStartedPage = false }: OptimizedContentLoaderProps) => {
  const hasHashnodeContent = content.content.includes('***');

  return (
    <div className="max-w-none">
      <Suspense fallback={<ContentLoadingSkeleton />}>
        {hasHashnodeContent ? (
          <HashnodeMarkdownRenderer content={content.content} />
        ) : (
          <div className="hn-markdown-renderer">
            <MarkdownRenderer content={content.content} />
          </div>
        )}
      </Suspense>
    </div>
  );
});

OptimizedContentLoader.displayName = 'OptimizedContentLoader';

export { OptimizedContentLoader };
