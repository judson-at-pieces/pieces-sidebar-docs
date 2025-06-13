
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Github, Users, RefreshCw } from 'lucide-react';

interface AdminTOCProps {
  className?: string;
}

export function AdminTableOfContents({ className }: AdminTOCProps) {
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
                className="flex items-center w-full text-left text-sm transition-colors hover:text-foreground cursor-pointer text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2"
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
