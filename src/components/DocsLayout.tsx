import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigation } from "@/hooks/useNavigation";
import Footer from "./Footer";
import type { NavigationItem, NavigationSection } from "@/services/navigationService";

function DocsSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { navigation, isLoading, error } = useNavigation();

  useEffect(() => {
    // Auto-open all sections by default
    if (navigation?.sections) {
      const allSectionIds = navigation.sections.map(section => section.id);
      setOpenSections(allSectionIds);
    }
  }, [navigation]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isSectionOpen = (sectionId: string) => openSections.includes(sectionId);

  // Build hierarchical structure from flat items
  const buildHierarchy = (items: NavigationItem[]): NavigationItem[] => {
    const itemMap = new Map<string, NavigationItem>();
    const rootItems: NavigationItem[] = [];

    // First pass: create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, items: [] });
    });

    // Second pass: build hierarchy
    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)!;
      
      if (item.parent_id && itemMap.has(item.parent_id)) {
        // This is a child item
        const parent = itemMap.get(item.parent_id)!;
        if (!parent.items) parent.items = [];
        parent.items.push(mappedItem);
      } else {
        // This is a root item
        rootItems.push(mappedItem);
      }
    });

    // Sort items by order_index
    const sortItems = (items: NavigationItem[]) => {
      items.sort((a, b) => a.order_index - b.order_index);
      items.forEach(item => {
        if (item.items && item.items.length > 0) {
          sortItems(item.items);
        }
      });
    };

    sortItems(rootItems);
    return rootItems;
  };

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
    ? navigation.sections.map(section => {
        const hierarchicalItems = buildHierarchy(section.items);
        return {
          ...section,
          items: filterItems(hierarchicalItems, searchTerm)
        };
      }).filter(section => 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.items.length > 0
      )
    : navigation.sections.map(section => ({
        ...section,
        items: buildHierarchy(section.items)
      }));

  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const hasSubItems = item.items && item.items.length > 0;
    const paddingClass = depth === 0 ? "px-3" : depth === 1 ? "px-5" : depth === 2 ? "px-7" : "px-9";

    if (hasSubItems) {
      return (
        <div key={item.id}>
          <Collapsible 
            open={isSectionOpen(item.id)} 
            onOpenChange={() => toggleSection(item.id)}
          >
            <div className="flex items-center">
              {item.href ? (
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex-1 flex items-center py-3 min-h-[44px] text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
                    paddingClass,
                    isActive(item.href)
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
                  {isSectionOpen(item.id) ? (
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
        key={item.id}
        to={item.href}
        onClick={onNavigate}
        className={cn(
          "block py-3 min-h-[44px] text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
          paddingClass,
          isActive(item.href)
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {item.title}
      </Link>
    );
  };

  if (isLoading) {
    return (
      <ScrollArea className={cn("h-full w-full lg:w-64", className)}>
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <ScrollArea className={cn("h-full w-full lg:w-64", className)}>
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="text-sm text-muted-foreground">
              Failed to load navigation
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

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
              <div key={section.id}>
                <div className="px-3 py-2 text-sm font-semibold text-foreground break-words whitespace-normal leading-tight text-left">
                  {section.title}
                </div>
                <div className="ml-2 space-y-1">
                  {section.items?.map((item) => renderNavItem(item))}
                </div>
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
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}
