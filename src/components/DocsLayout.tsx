
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, X, Home, FileText, Book, Zap, Settings, HelpCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';
import { TableOfContents } from './markdown/TableOfContents';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  items?: NavItem[];
}

interface NavigationStructure {
  [key: string]: NavItem;
}

const contentStructure: NavigationStructure = {
  'meet-pieces': {
    title: 'Meet Pieces',
    href: '/docs/meet-pieces',
    icon: <Book className="h-4 w-4 mr-2" />,
    items: [
      { title: 'macOS Installation Guide', href: '/docs/meet-pieces/macos-installation-guide' },
      { title: 'Windows Installation Guide', href: '/docs/meet-pieces/windows-installation-guide' },
      { title: 'Linux Installation Guide', href: '/docs/meet-pieces/linux-installation-guide' },
    ],
  },
  'extensions-plugins': {
    title: 'Extensions & Plugins',
    href: '/docs/extensions-plugins',
    icon: <Zap className="h-4 w-4 mr-2" />,
    items: [
      { title: 'Visual Studio Code', href: '/docs/extensions-plugins/visual-studio-code' },
      { title: 'JetBrains', href: '/docs/extensions-plugins/jetbrains' },
      { title: 'Visual Studio', href: '/docs/extensions-plugins/visual-studio' },
      { title: 'Sublime Text', href: '/docs/extensions-plugins/sublime' },
      { title: 'Neovim', href: '/docs/extensions-plugins/neovim-plugin' },
      { title: 'JupyterLab', href: '/docs/extensions-plugins/jupyterlab' },
    ],
  },
  'reference': {
    title: 'Reference',
    href: '/docs/reference',
    icon: <FileText className="h-4 w-4 mr-2" />,
    items: [
      { title: 'CLI', href: '/docs/reference/cli' },
      { title: 'Cloud API', href: '/docs/reference/cloud-api' },
      { title: 'Turi API', href: '/docs/reference/turi-api' },
    ],
  },
  'community': {
    title: 'Community',
    href: '/docs/community',
    icon: <Users className="h-4 w-4 mr-2" />,
    items: [
      { title: 'Contribution Guide', href: '/docs/community/contribution-guide' },
      { title: 'Code of Conduct', href: '/docs/community/code-of-conduct' },
    ],
  },
  'support': {
    title: 'Support',
    href: '/docs/support',
    icon: <HelpCircle className="h-4 w-4 mr-2" />,
    items: [
      { title: 'FAQ', href: '/docs/support/faq' },
      { title: 'Troubleshooting', href: '/docs/support/troubleshooting' },
      { title: 'Contact Us', href: '/docs/support/contact-us' },
    ],
  },
  'settings': {
    title: 'Settings',
    href: '/docs/settings',
    icon: <Settings className="h-4 w-4 mr-2" />,
    items: [],
  },
};

const navigationStructure: NavigationStructure = {
  'home': {
    title: 'Home',
    href: '/',
    icon: <Home className="h-4 w-4 mr-2" />,
  },
  ...contentStructure,
};

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    // Extract the content from the children prop
    // Assuming that the content is passed as a string
    if (typeof children === 'string') {
      setContent(children);
    } else {
      setContent('');
    }
  }, [children]);

  useEffect(() => {
    // Determine the active section based on the current path
    const pathParts = location.pathname.split('/');
    const section = pathParts[2] || null;
    setActiveSection(section);
  }, [location.pathname]);

  const getNavItems = (): NavItem[] => {
    return Object.keys(navigationStructure).map(key => navigationStructure[key]);
  };

  const renderNavItem = (item: NavItem, level: number = 0): React.ReactNode => {
    const isActive = location.pathname.startsWith(item.href);
    const indentClass = level > 0 ? `ml-${level * 4}` : '';

    return (
      <li key={item.href}>
        <Link
          to={item.href}
          className={`flex items-center justify-between p-2 rounded-md hover:bg-secondary ${isActive ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground'} ${indentClass}`}
        >
          <div className="flex items-center">
            {item.icon}
            <span>{item.title}</span>
          </div>
          {item.items && item.items.length > 0 && <ChevronRight className="h-4 w-4" />}
        </Link>
        {item.items && item.items.length > 0 && (
          <ul className="space-y-1">
            {item.items.map(child => renderNavItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="flex flex-col h-full pt-6">
                <Link to="/" className="px-4 py-2 font-bold">
                  Pieces Docs
                </Link>
                <nav className="flex flex-col flex-1 space-y-1">
                  <ul className="space-y-1">
                    {getNavItems().map(item => renderNavItem(item))}
                  </ul>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Pieces Docs</span>
            </Link>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Search could go here */}
            </div>
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
              <UserMenu />
            </nav>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 hidden w-[220px] lg:block">
          <div className="space-y-2 py-4">
            <h4 className="mb-1 font-medium">Navigation</h4>
            <ul className="mt-2 space-y-1">
              {getNavItems().map(item => renderNavItem(item))}
            </ul>
          </div>
        </aside>
        <main className="flex-1 py-8">
          {children}
        </main>
        {content && (
          <TableOfContents content={content} />
        )}
      </div>
    </div>
  );
}
