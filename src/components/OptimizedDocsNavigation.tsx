
import React, { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/services/navigationService';

interface OptimizedNavItemProps {
  item: NavigationItem;
  depth?: number;
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

const OptimizedNavItem = memo(({ 
  item, 
  depth = 0, 
  isOpen, 
  onToggle, 
  currentPath 
}: OptimizedNavItemProps) => {
  const hasSubItems = item.items && item.items.length > 0;
  const paddingClass = depth === 0 ? "px-3" : depth === 1 ? "px-5" : depth === 2 ? "px-7" : "px-9";
  const isActive = currentPath === item.href;

  // Memoize the render to prevent unnecessary re-renders
  const content = useMemo(() => {
    if (hasSubItems) {
      return (
        <div>
          <Collapsible open={isOpen} onOpenChange={onToggle}>
            <div className="flex items-center">
              {item.href ? (
                <Link
                  to={item.href}
                  className={cn(
                    "flex-1 flex items-center py-3 min-h-[44px] text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
                    paddingClass,
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="break-words whitespace-normal leading-tight text-left">{item.title}</span>
                </Link>
              ) : (
                <div className={cn("flex-1 flex items-center py-2 text-sm", paddingClass)}>
                  <span className="break-words whitespace-normal leading-tight font-semibold text-foreground text-left">
                    {item.title}
                  </span>
                </div>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[36px] min-w-[36px] flex-shrink-0 mr-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1">
              {item.items!.map((subItem: NavigationItem) => (
                <OptimizedNavItem
                  key={subItem.id}
                  item={subItem}
                  depth={depth + 1}
                  isOpen={false} // Simplified for performance
                  onToggle={() => {}} // Simplified for performance
                  currentPath={currentPath}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <Link
        to={item.href}
        className={cn(
          "block py-3 min-h-[44px] text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
          paddingClass,
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {item.title}
      </Link>
    );
  }, [item, depth, isOpen, isActive, hasSubItems, paddingClass]);

  return content;
});

OptimizedNavItem.displayName = 'OptimizedNavItem';

export { OptimizedNavItem };
