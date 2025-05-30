
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, FileText, Home, Edit } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

// Documentation structure
const docsSections = [
  {
    title: 'Meet Pieces',
    items: [
      { title: 'Fundamentals', path: '/docs/meet-pieces/fundamentals' },
      { title: 'Windows Installation Guide', path: '/docs/meet-pieces/windows-installation-guide' },
      { title: 'macOS Installation Guide', path: '/docs/meet-pieces/macos-installation-guide' },
      { title: 'Linux Installation Guide', path: '/docs/meet-pieces/linux-installation-guide' },
      {
        title: 'Troubleshooting',
        items: [
          { title: 'Cross Platform', path: '/docs/meet-pieces/troubleshooting/cross-platform' },
          { title: 'macOS', path: '/docs/meet-pieces/troubleshooting/macos' },
          { title: 'Windows', path: '/docs/meet-pieces/troubleshooting/windows' },
          { title: 'Linux', path: '/docs/meet-pieces/troubleshooting/linux' },
        ]
      }
    ]
  },
  {
    title: 'Quick Guides',
    items: [
      { title: 'Overview', path: '/docs/quick-guides/overview' },
      { title: 'LTM Context', path: '/docs/quick-guides/ltm-context' },
      { title: 'Copilot with Context', path: '/docs/quick-guides/copilot-with-context' },
    ]
  },
  {
    title: 'Desktop App',
    items: [
      { title: 'Download', path: '/docs/desktop/download' },
      { title: 'Onboarding', path: '/docs/desktop/onboarding' },
    ]
  }
];

function SidebarContent() {
  const location = useLocation();

  const renderNavItem = (item: any, depth = 0) => {
    const isActive = location.pathname === item.path;
    const hasChildren = item.items && item.items.length > 0;

    if (hasChildren) {
      return (
        <div key={item.title} className={`mb-2 ${depth > 0 ? 'ml-4' : ''}`}>
          <div className="font-medium text-sm text-muted-foreground mb-1 px-2">
            {item.title}
          </div>
          {item.items.map((child: any) => renderNavItem(child, depth + 1))}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`block px-2 py-1.5 text-sm rounded-md transition-colors ${depth > 0 ? 'ml-4' : ''} ${
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
      >
        {item.title}
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {docsSections.map((section) => (
        <div key={section.title}>
          <h3 className="font-semibold text-foreground mb-2 px-2">{section.title}</h3>
          <div className="space-y-1">
            {section.items.map((item) => renderNavItem(item))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-bold">Pieces Docs</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
            </div>
          </div>
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-bold">Pieces Docs</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-4 py-4">
            <SidebarContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-border bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold">Pieces Docs</span>
              </Link>
              <ThemeToggle />
            </div>
            <ScrollArea className="flex-1 px-4 py-4">
              <SidebarContent />
            </ScrollArea>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  {user && (hasRole('editor') || hasRole('admin')) && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/edit">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Docs
                      </Link>
                    </Button>
                  )}
                  {!user && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/auth">
                        Sign In
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 relative overflow-hidden">
            <div className="h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
