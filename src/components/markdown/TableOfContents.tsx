
import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown } from 'lucide-react';
import { TOCItem } from './types';

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown content and find actual rendered headings
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      items.push({
        id,
        text,
        level
      });
    }

    // Also try to find actual headings in the DOM and add IDs if they don't exist
    setTimeout(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading) => {
        if (!heading.id) {
          const text = heading.textContent || '';
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          heading.id = id;
        }
      });
    }, 100);

    setTocItems(items);
  }, [content]);

  useEffect(() => {
    // Set up intersection observer to track active heading
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(Boolean);
    
    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the heading that's most visible
        let mostVisible = entries[0];
        let maxVisibility = 0;

        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxVisibility) {
            maxVisibility = entry.intersectionRatio;
            mostVisible = entry;
          }
        });

        // If we have a visible heading, set it as active
        if (mostVisible && mostVisible.isIntersecting) {
          setActiveId(mostVisible.target.id);
        } else {
          // If no headings are visible, find the closest one above the viewport
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          let closestHeading = null;
          let closestDistance = Infinity;

          headingElements.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            const distance = Math.abs(rect.top);
            
            if (rect.top <= 100 && distance < closestDistance) {
              closestDistance = distance;
              closestHeading = heading;
            }
          });

          if (closestHeading) {
            setActiveId(closestHeading.id);
          }
        }
      },
      {
        rootMargin: '-10% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    headingElements.forEach(element => {
      if (element) observer.observe(element);
    });

    // Also listen to scroll events for better tracking
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Find the heading that's currently closest to the top of the viewport
      let activeHeading = null;
      let minDistance = Infinity;

      headingElements.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top - 100); // 100px offset from top
        
        if (rect.top <= 150 && distance < minDistance) {
          minDistance = distance;
          activeHeading = heading;
        }
      });

      if (activeHeading && activeHeading.id !== activeId) {
        setActiveId(activeHeading.id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      headingElements.forEach(element => {
        if (element) observer.unobserve(element);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, [tocItems, activeId]);

  const scrollToHeading = (id: string) => {
    // First try to find the element by ID
    let element = document.getElementById(id);
    
    // If not found, try to find by text content
    if (!element) {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const targetItem = tocItems.find(item => item.id === id);
      if (targetItem) {
        element = Array.from(headings).find(heading => 
          heading.textContent?.toLowerCase().includes(targetItem.text.toLowerCase())
        ) as HTMLElement;
        
        // Add the ID to the element if found
        if (element && !element.id) {
          element.id = id;
        }
      }
    }
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update the URL hash without triggering a page reload
      window.history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    } else {
      console.warn(`Could not find heading element for ID: ${id}`);
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <div className="w-full lg:w-64 shrink-0">
      {/* Mobile TOC - collapsible */}
      <div className="lg:hidden mb-6 border rounded-lg p-4 bg-muted/30">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              On this page
            </h3>
            <ChevronDown className="h-4 w-4 text-black group-open:rotate-180 transition-transform" />
          </summary>
          <nav className="mt-4 space-y-1 max-h-64 overflow-y-auto">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`block w-full text-left text-sm transition-colors hover:text-foreground cursor-pointer ${
                  activeId === item.id 
                    ? 'text-foreground font-medium border-l-2 border-primary' 
                    : 'text-muted-foreground border-l-2 border-transparent hover:border-primary/50'
                } ${
                  item.level === 1 ? 'pl-3' : 
                  item.level === 2 ? 'pl-7' : 
                  'pl-11'
                } py-1.5`}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </details>
      </div>

      {/* Desktop TOC - sticky sidebar that follows scroll */}
      <div className="hidden lg:block fixed top-24 right-8 z-40 max-h-[calc(100vh-8rem)] w-64">
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
            On this page
          </h3>
          <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
            <nav className="space-y-1 pr-2">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`block w-full text-left text-sm transition-all duration-200 hover:text-foreground cursor-pointer rounded-md ${
                    activeId === item.id 
                      ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary' 
                      : 'text-muted-foreground border-l-2 border-transparent hover:border-primary/50 hover:bg-muted/50'
                  } ${
                    item.level === 1 ? 'pl-3' : 
                    item.level === 2 ? 'pl-7' : 
                    'pl-11'
                  } py-2 pr-3`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
