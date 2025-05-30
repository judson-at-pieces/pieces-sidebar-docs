
import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TOCItem } from './types';

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown content
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

    setTocItems(items);
  }, [content]);

  useEffect(() => {
    // Set up intersection observer to track active heading
    const headingElements = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
    
    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Get the first visible heading
          const firstVisible = visibleEntries[0];
          setActiveId(firstVisible.target.id);
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    );

    headingElements.forEach(element => {
      if (element) observer.observe(element);
    });

    return () => {
      headingElements.forEach(element => {
        if (element) observer.unobserve(element);
      });
    };
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <span className="text-muted-foreground group-open:rotate-90 transition-transform">
              ▶
            </span>
          </summary>
          <nav className="mt-4 space-y-1 max-h-64 overflow-y-auto">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`block w-full text-left text-sm transition-colors hover:text-foreground ${
                  activeId === item.id 
                    ? 'text-foreground font-medium border-l-2 border-primary' 
                    : 'text-muted-foreground border-l-2 border-transparent'
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

      {/* Desktop TOC - sticky sidebar */}
      <div className="hidden lg:block sticky top-6">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
          On this page
        </h3>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`block w-full text-left text-sm transition-colors hover:text-foreground ${
                  activeId === item.id 
                    ? 'text-foreground font-medium border-l-2 border-primary' 
                    : 'text-muted-foreground border-l-2 border-transparent'
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
        </ScrollArea>
      </div>
    </div>
  );
}
