
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Github, Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminTOCProps {
  className?: string;
}

export function AdminTableOfContents({ className }: AdminTOCProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  const tocItems = [
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      icon: BarChart3,
    },
    {
      id: 'github-integration',
      title: 'GitHub Integration',
      icon: Github,
    },
    {
      id: 'content-sync',
      title: 'Content Synchronization',
      icon: RefreshCw,
    },
    {
      id: 'user-management',
      title: 'User Management',
      icon: Users,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
      
      // Find which section is currently most visible
      let currentSection = '';
      let maxVisibility = 0;

      sections.forEach(section => {
        if (section) {
          const rect = section.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Calculate how much of the section is visible
          const visibleTop = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
          const visiblePercentage = visibleTop / Math.min(rect.height, viewportHeight);
          
          // Consider sections that are at least 20% visible or if we're near the top
          if (visiblePercentage > 0.2 || (rect.top <= 100 && rect.bottom > 0)) {
            if (visiblePercentage > maxVisibility || rect.top <= 100) {
              maxVisibility = visiblePercentage;
              currentSection = section.id;
            }
          }
        }
      });

      setActiveSection(currentSection);
    };

    // Initial check
    handleScroll();

    // Add scroll listener with throttling
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`w-64 shrink-0 ${className}`}>
      <div className="sticky top-6">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
          On this page
        </h3>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "flex items-center w-full text-left text-sm transition-colors cursor-pointer rounded-md px-3 py-2",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}
