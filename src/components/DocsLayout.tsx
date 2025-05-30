import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { contentRegistry } from "@/compiled-content";

interface NavigationItem {
  title: string;
  href: string;
  items?: NavigationItem[];
  isBold?: boolean;
  isSection?: boolean;
}

interface NavigationSection {
  title: string;
  href?: string;
  isSection?: boolean;
  items?: NavigationItem[];
}

function buildNavigationFromRegistry(): NavigationSection[] {
  const pathMap = new Map<string, NavigationItem>();
  const rootSections = new Map<string, NavigationSection>();

  // Process all compiled content paths
  Object.entries(contentRegistry).forEach(([path, module]) => {
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length === 0) return;

    // Create navigation item
    const item: NavigationItem = {
      title: module.frontmatter.title || pathParts[pathParts.length - 1].replace(/-/g, ' '),
      href: path
    };

    // Organize by sections
    if (pathParts.length === 1) {
      // Root level item
      const sectionKey = pathParts[0];
      if (!rootSections.has(sectionKey)) {
        rootSections.set(sectionKey, {
          title: item.title,
          href: path,
          isSection: true,
          items: []
        });
      }
    } else {
      // Nested item - organize under parent section
      const sectionKey = pathParts[0];
      if (!rootSections.has(sectionKey)) {
        rootSections.set(sectionKey, {
          title: sectionKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          isSection: true,
          items: []
        });
      }

      const section = rootSections.get(sectionKey)!;
      if (!section.items) section.items = [];

      // Handle nested structure
      if (pathParts.length === 2) {
        // Direct child
        section.items.push(item);
      } else {
        // Find or create parent item
        const parentPath = `/${pathParts.slice(0, -1).join('/')}`;
        let parentItem = section.items.find(i => i.href === parentPath);
        
        if (!parentItem) {
          parentItem = {
            title: pathParts[pathParts.length - 2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            href: parentPath,
            items: []
          };
          section.items.push(parentItem);
        }
        
        if (!parentItem.items) parentItem.items = [];
        parentItem.items.push(item);
      }
    }
  });

  // Convert to array and sort
  const sections = Array.from(rootSections.values()).sort((a, b) => {
    // Define custom order for main sections
    const order = ['meet-pieces', 'quick-guides', 'desktop', 'core-dependencies', 'mcp', 'extensions-plugins', 'productivity', 'large-language-models', 'more', 'help'];
    const aIndex = order.findIndex(o => a.title.toLowerCase().includes(o) || a.href?.includes(o));
    const bIndex = order.findIndex(o => b.title.toLowerCase().includes(o) || b.href?.includes(o));
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.title.localeCompare(b.title);
  });

  return sections;
}

function DocsSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [navigation, setNavigation] = useState<NavigationSection[]>([]);

  useEffect(() => {
    // Build navigation from compiled content registry
    const dynamicNavigation = buildNavigationFromRegistry();
    setNavigation(dynamicNavigation);
    
    // Auto-open all sections by default
    const allSectionTitles = dynamicNavigation.map(section => section.title);
    setOpenSections(allSectionTitles);
  }, []);

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isSectionOpen = (sectionTitle: string) => openSections.includes(sectionTitle);

  const filterItems = (items: NavigationItem[], searchTerm: string): NavigationItem[] => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      if (item.items) {
        const filteredSubItems = filterItems(item.items, searchTerm);
        return matchesSearch || filteredSubItems.length > 0;
      }
      return matchesSearch;
    }).map(item => {
      if (item.items) {
        return {
          ...item,
          items: filterItems(item.items, searchTerm)
        };
      }
      return item;
    });
  };

  const filteredNavigation = searchTerm 
    ? navigation.map(section => ({
        ...section,
        items: section.items ? filterItems(section.items, searchTerm) : undefined
      })).filter(section => 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (section.items && section.items.length > 0)
      )
    : navigation;

  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const hasSubItems = item.items && item.items.length > 0;
    const paddingClass = depth === 0 ? "px-3" : depth === 1 ? "px-5" : depth === 2 ? "px-7" : "px-9";

    if (hasSubItems) {
      return (
        <div key={item.title}>
          <Collapsible 
            open={isSectionOpen(item.title)} 
            onOpenChange={() => toggleSection(item.title)}
          >
            <div className="flex items-center">
              {item.href ? (
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex-1 flex items-center py-3 min-h-[44px] text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
                    paddingClass,
                    item.isBold && "font-bold",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="break-words whitespace-normal leading-tight text-left">{item.title}</span>
                </Link>
              ) : (
                <div className={cn("flex-1 flex items-center py-2 text-sm", paddingClass)}>
                  <span className={cn(
                    "break-words whitespace-normal leading-tight font-semibold text-foreground text-left",
                    item.isBold && "font-bold"
                  )}>
                    {item.title}
                  </span>
                </div>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[36px] min-w-[36px] flex-shrink-0 mr-2">
                  {isSectionOpen(item.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1">
              {item.items!.map((subItem: NavigationItem) => renderNavItem(subItem, depth + 1))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onNavigate}
        className={cn(
          "block py-3 min-h-[44px] text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
          paddingClass,
          item.isBold && "font-bold",
          isActive(item.href)
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {item.title}
      </Link>
    );
  };

  return (
    <ScrollArea className={cn("h-full w-full lg:w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-6">
            {searchTerm && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSearchTerm("")}
                  className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-left"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {filteredNavigation.map((section) => (
              <div key={section.title}>
                {section.isSection ? (
                  <div>
                    <div className="px-3 py-2 text-sm font-semibold text-foreground break-words whitespace-normal leading-tight text-left">
                      {section.title}
                    </div>
                    <div className="ml-2 space-y-1">
                      {section.items?.map((item) => renderNavItem(item))}
                    </div>
                  </div>
                ) : (
                  renderNavItem(section as NavigationItem)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
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
        <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
          <ScrollArea className="h-full">
            <DocsSidebar onNavigate={() => setSidebarOpen(false)} className="w-full" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-border bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold">Docs</span>
              </Link>
              <ThemeToggle />
            </div>
            <DocsSidebar />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-4 sm:py-6 lg:py-8">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
