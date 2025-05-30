

import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigation = [
  {
    title: "Meet Pieces",
    href: "/docs/meet-pieces",
    isBold: true,
    items: [
      { title: "Fundamentals", href: "/docs/meet-pieces/fundamentals" },
      { title: "Windows Installation Guide", href: "/docs/meet-pieces/windows-installation-guide" },
      { title: "macOS Installation Guide", href: "/docs/meet-pieces/macos-installation-guide" },
      { title: "Linux Installation Guide", href: "/docs/meet-pieces/linux-installation-guide" },
      {
        title: "Troubleshooting",
        href: "/docs/meet-pieces/troubleshooting",
        items: [
          { title: "Cross-Platform", href: "/docs/meet-pieces/troubleshooting/cross-platform" },
          { title: "macOS", href: "/docs/meet-pieces/troubleshooting/macos" },
          { title: "Windows", href: "/docs/meet-pieces/troubleshooting/windows" },
          { title: "Linux", href: "/docs/meet-pieces/troubleshooting/linux" },
        ],
      },
    ],
  },
  {
    title: "Quick Guides",
    href: "/docs/quick-guides",
    isSection: true,
    items: [
      { title: "Overview", href: "/docs/quick-guides/overview" },
      { title: "Using Long-Term Memory Context", href: "/docs/quick-guides/ltm-context" },
      { title: "Using Pieces Copilot with Context", href: "/docs/quick-guides/copilot-with-context" },
      {
        title: "Long-Term Memory Prompting Guide",
        href: "/docs/quick-guides/ltm-prompting",
        items: [
          { title: "Use Cases and Example Prompts", href: "/docs/quick-guides/ltm-prompting/examples" },
          { title: "Use Cases for the Pieces Workstream Activity View", href: "/docs/quick-guides/ltm-prompting/workstream-activity" },
          { title: "General Long-Term Memory Prompting Tips", href: "/docs/quick-guides/ltm-prompting/tips" },
        ],
      },
    ],
  },
  {
    title: "Desktop App",
    href: "/docs/desktop",
    isSection: true,
    items: [
      { title: "Download & Install", href: "/docs/desktop/download" },
      { title: "Onboarding", href: "/docs/desktop/onboarding" },
      {
        title: "Pieces Copilot",
        href: "/docs/desktop/copilot",
        items: [
          { title: "Interacting with Pieces Copilot", href: "/docs/desktop/copilot/interaction" },
          { title: "Context & Project Integration", href: "/docs/desktop/copilot/integration" },
          { title: "Configuring Pieces Copilot", href: "/docs/desktop/copilot/configuration" },
          { title: "Multiple Environments", href: "/docs/desktop/copilot/multiple-environments" },
        ],
      },
      {
        title: "Pieces Drive",
        href: "/docs/desktop/drive",
        items: [
          { title: "Saving & Organizing Materials", href: "/docs/desktop/drive/save-and-organize" },
          { title: "Searching & Filtering", href: "/docs/desktop/drive/search-and-filter" },
          { title: "Enrichment & Metadata", href: "/docs/desktop/drive/enrichment-and-metadata" },
          { title: "Transforming Code", href: "/docs/desktop/drive/transforming-code" },
          { title: "Sharing", href: "/docs/desktop/drive/sharing" },
        ],
      },
      { title: "Workstream Activity", href: "/docs/desktop/workstream-activity" },
      {
        title: "Navigation",
        href: "/docs/desktop/navigation",
        items: [
          { title: "Settings", href: "/docs/desktop/navigation/settings" },
          { title: "Captured Context", href: "/docs/desktop/navigation/captured-context" },
          { title: "Updates & Upcoming", href: "/docs/desktop/navigation/updates" },
          { title: "Snippet Discovery", href: "/docs/desktop/navigation/snippet-discovery" },
          { title: "Workflow Activity", href: "/docs/desktop/navigation/workflow-activity" },
          { title: "Global Search", href: "/docs/desktop/navigation/global-search" },
        ],
      },
      {
        title: "Configuration",
        href: "/docs/desktop/configuration",
        items: [
          { title: "Account & Cloud", href: "/docs/desktop/configuration/account-and-cloud" },
          { title: "Pieces Copilot & Machine Learning", href: "/docs/desktop/configuration/copilot-and-machine-learning" },
          { title: "Model Context Protocol (MCP)", href: "/docs/desktop/configuration/mcp" },
          { title: "Aesthetics & Layouts", href: "/docs/desktop/configuration/aesthetics-layout" },
          { title: "Additional Settings", href: "/docs/desktop/configuration/additional-settings" },
          { title: "Support & Information", href: "/docs/desktop/configuration/support" },
        ],
      },
      {
        title: "Actions & Keyboard Shortcuts",
        href: "/docs/desktop/actions",
        items: [
          { title: "Power Menu", href: "/docs/desktop/actions/power-menu" },
          { title: "Keyboard Shortcuts", href: "/docs/desktop/actions/keyboard-shortcuts" },
        ],
      },
      {
        title: "Troubleshooting",
        href: "/docs/desktop/troubleshooting",
        items: [
          { title: "Cross-Platform", href: "/docs/desktop/troubleshooting/cross-platform" },
          { title: "macOS", href: "/docs/desktop/troubleshooting/macos" },
          { title: "Windows", href: "/docs/desktop/troubleshooting/windows" },
          { title: "Linux", href: "/docs/desktop/troubleshooting/linux" },
        ],
      },
    ],
  },
  {
    title: "Core Dependencies",
    href: "/docs/core-dependencies",
    isSection: true,
    items: [
      {
        title: "PiecesOS",
        href: "/docs/core-dependencies/pieces-os",
        items: [
          { title: "Manual Installation", href: "/docs/core-dependencies/pieces-os/manual-installation" },
          { title: "Quick Menu", href: "/docs/core-dependencies/pieces-os/quick-menu" },
          { title: "Troubleshooting", href: "/docs/core-dependencies/pieces-os/troubleshooting" },
        ],
      },
      {
        title: "Ollama",
        href: "/docs/core-dependencies/ollama",
        items: [
          { title: "Manual Installation", href: "/docs/core-dependencies/ollama/manual-installation" },
          { title: "Supported Models", href: "/docs/core-dependencies/ollama/supported-models" },
          { title: "Troubleshooting", href: "/docs/core-dependencies/ollama/troubleshooting" },
        ],
      },
      { title: "On-Device Storage", href: "/docs/core-dependencies/on-device-storage" },
    ],
  },
  {
    title: "Model Context Protocol (MCP)",
    href: "/docs/mcp",
    isSection: true,
    items: [
      { title: "Get Started", href: "/docs/mcp/get-started" },
      { title: "MCP Prompting", href: "/docs/mcp/prompting" },
      { title: "MCP → Cursor", href: "/docs/mcp/cursor" },
      { title: "MCP → GitHub Copilot", href: "/docs/mcp/github-copilot" },
      { title: "MCP → Goose", href: "/docs/mcp/goose" },
    ],
  },
  {
    title: "Extensions & Plugins",
    href: "/docs/extensions-plugins",
    isSection: true,
    items: [
      {
        title: "Visual Studio Code",
        href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code",
        items: [
          { title: "Get Started", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/get-started" },
          { title: "Commands", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/commands" },
          { title: "Configuration", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/configuration" },
          {
            title: "Pieces Copilot",
            href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/copilot",
            items: [
              { title: "Chat", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/copilot/chat" },
              { title: "Debugging Errors", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/copilot/debugging-errors" },
              { title: "Documenting Code", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/copilot/documenting-code" },
              { title: "LLM Settings", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/copilot/llm-settings" },
              { title: "Refactoring", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/copilot/refactoring" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/drive",
            items: [
              { title: "Edit & Update", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/drive/edit-update" },
              { title: "Save Snippets", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/drive/save-snippets" },
              { title: "Search & Reuse", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/drive/search-reuse" },
              { title: "Sharing", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/drive/sharing" },
            ],
          },
          { title: "Forks", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/forks" },
          { title: "Troubleshooting", href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code/troubleshooting" },
        ],
      },
      {
        title: "JetBrains",
        href: "/docs/extensions-plugins/extensions-plugins/jetbrains",
        items: [
          { title: "Get Started", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/get-started" },
          { title: "Commands", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/commands" },
          { title: "Configuration", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/configuration" },
          {
            title: "Pieces Copilot",
            href: "/docs/extensions-plugins/extensions-plugins/jetbrains/copilot",
            items: [
              { title: "Chat", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/copilot/chat" },
              { title: "Debugging Errors", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/copilot/debugging-errors" },
              { title: "Documenting Code", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/copilot/documenting-code" },
              { title: "LLM Settings", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/copilot/llm-settings" },
              { title: "Refactoring", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/copilot/refactoring" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/extensions-plugins/extensions-plugins/jetbrains/drive",
            items: [
              { title: "Edit & Update", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/drive/edit-update" },
              { title: "Save Snippets", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/drive/save-snippets" },
              { title: "Search & Reuse", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/drive/search-reuse" },
              { title: "Sharing", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/drive/sharing" },
            ],
          },
          { title: "Troubleshooting", href: "/docs/extensions-plugins/extensions-plugins/jetbrains/troubleshooting" },
        ],
      },
      {
        title: "Visual Studio",
        href: "/docs/extensions-plugins/extensions-plugins/visual-studio",
        items: [
          { title: "Get Started", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/get-started" },
          { title: "Commands", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/commands" },
          { title: "Configuration", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/configuration" },
          {
            title: "Pieces Copilot",
            href: "/docs/extensions-plugins/extensions-plugins/visual-studio/copilot",
            items: [
              { title: "Chat", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/copilot/chat" },
              { title: "Documenting Code", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/copilot/documenting-code" },
              { title: "LLM Settings", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/copilot/llm-settings" },
              { title: "Refactoring", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/copilot/refactoring" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/extensions-plugins/extensions-plugins/visual-studio/drive",
            items: [
              { title: "Edit & Update", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/drive/edit-update" },
              { title: "Save Snippets", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/drive/save-snippets" },
              { title: "Search & Reuse", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/drive/search-reuse" },
              { title: "Sharing", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/drive/sharing" },
            ],
          },
          { title: "Troubleshooting", href: "/docs/extensions-plugins/extensions-plugins/visual-studio/troubleshooting" },
        ],
      },
      {
        title: "Sublime Text",
        href: "/docs/extensions-plugins/extensions-plugins/sublime",
        items: [
          { title: "Get Started", href: "/docs/extensions-plugins/extensions-plugins/sublime/get-started" },
          { title: "Commands", href: "/docs/extensions-plugins/extensions-plugins/sublime/commands" },
          { title: "Configuration", href: "/docs/extensions-plugins/extensions-plugins/sublime/configuration" },
          {
            title: "Pieces Copilot",
            href: "/docs/extensions-plugins/extensions-plugins/sublime/copilot",
            items: [
              { title: "Chat", href: "/docs/extensions-plugins/extensions-plugins/sublime/copilot/chat" },
              { title: "Debugging Errors", href: "/docs/extensions-plugins/extensions-plugins/sublime/copilot/debugging-errors" },
              { title: "Documenting Code", href: "/docs/extensions-plugins/extensions-plugins/sublime/copilot/documenting-code" },
              { title: "LLM Settings", href: "/docs/extensions-plugins/extensions-plugins/sublime/copilot/llm-settings" },
              { title: "Refactoring", href: "/docs/extensions-plugins/extensions-plugins/sublime/copilot/refactoring" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/extensions-plugins/extensions-plugins/sublime/drive",
            items: [
              { title: "Edit & Update", href: "/docs/extensions-plugins/extensions-plugins/sublime/drive/edit-update" },
              { title: "Save Snippets", href: "/docs/extensions-plugins/extensions-plugins/sublime/drive/save-snippets" },
              { title: "Search & Reuse", href: "/docs/extensions-plugins/extensions-plugins/sublime/drive/search-reuse" },
              { title: "Sharing", href: "/docs/extensions-plugins/extensions-plugins/sublime/drive/sharing" },
            ],
          },
          { title: "Troubleshooting", href: "/docs/extensions-plugins/extensions-plugins/sublime/troubleshooting" },
        ],
      },
      { title: "JupyterLab", href: "/docs/extensions-plugins/extensions-plugins/jupyterlab" },
      { title: "Neovim Plugin", href: "/docs/extensions-plugins/extensions-plugins/neovim-plugin" },
    ],
  },
  {
    title: "Productivity Tools",
    href: "/docs/productivity",
    isSection: true,
    items: [
      {
        title: "Obsidian",
        href: "/docs/obsidian",
        items: [
          { title: "Get Started", href: "/docs/obsidian/get-started" },
          { title: "Commands", href: "/docs/obsidian/commands" },
          { title: "Configuration", href: "/docs/obsidian/configuration" },
          {
            title: "Pieces Copilot",
            href: "/docs/obsidian/copilot",
            items: [
              { title: "Chat", href: "/docs/obsidian/copilot/chat" },
              { title: "LLM Settings", href: "/docs/obsidian/copilot/llm-settings" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/obsidian/drive",
            items: [
              { title: "Edit & Update", href: "/docs/obsidian/drive/edit-update" },
              { title: "Save Snippets", href: "/docs/obsidian/drive/save-snippets" },
              { title: "Search & Reuse", href: "/docs/obsidian/drive/search-reuse" },
              { title: "Sharing", href: "/docs/obsidian/drive/sharing" },
            ],
          },
          { title: "Troubleshooting", href: "/docs/obsidian/troubleshooting" },
        ],
      },
      {
        title: "Web Extension",
        href: "/docs/web-extension",
        items: [
          { title: "Get Started", href: "/docs/web-extension/get-started" },
          { title: "Configuration", href: "/docs/web-extension/configuration" },
          { title: "Shortcuts", href: "/docs/web-extension/shortcuts" },
          {
            title: "Pieces Copilot",
            href: "/docs/web-extension/copilot",
            items: [
              { title: "Chat", href: "/docs/web-extension/copilot/chat" },
              { title: "LLM Settings", href: "/docs/web-extension/copilot/llm-settings" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/web-extension/drive",
            items: [
              { title: "Edit & Update", href: "/docs/web-extension/drive/edit-update" },
              { title: "Save Snippets", href: "/docs/web-extension/drive/save-snippets" },
              { title: "Search & Reuse", href: "/docs/web-extension/drive/search-reuse" },
              { title: "Sharing", href: "/docs/web-extension/drive/sharing" },
            ],
          },
          { title: "Troubleshooting", href: "/docs/web-extension/troubleshooting" },
        ],
      },
      {
        title: "Pieces CLI",
        href: "/docs/cli",
        items: [
          { title: "Get Started", href: "/docs/cli/get-started" },
          { title: "Commands", href: "/docs/cli/commands" },
          { title: "Configuration", href: "/docs/cli/configuration" },
          {
            title: "Pieces Copilot",
            href: "/docs/cli/copilot",
            items: [
              { title: "Chat", href: "/docs/cli/copilot/chat" },
              { title: "LLMs Settings", href: "/docs/cli/copilot/llms-settings" },
            ],
          },
          {
            title: "Pieces Drive",
            href: "/docs/cli/drive",
            items: [
              { title: "Edit & Update", href: "/docs/cli/drive/edit-and-update" },
              { title: "Saving Materials", href: "/docs/cli/drive/saving-materials" },
              { title: "Search & Reuse", href: "/docs/cli/drive/search-and-reuse" },
              { title: "Sharing", href: "/docs/cli/drive/sharing" },
            ],
          },
          { title: "Troubleshooting", href: "/docs/cli/troubleshooting" },
        ],
      },
      { title: "Raycast", href: "/docs/raycast" },
    ],
  },
  {
    title: "Large Language Models",
    href: "/docs/large-language-models",
    isSection: true,
    items: [
      { title: "Cloud Models", href: "/docs/large-language-models/cloud-models" },
      { title: "Local Models", href: "/docs/large-language-models/local-models" },
    ],
  },
  {
    title: "More",
    href: "/docs/more",
    isSection: true,
    items: [
      { title: "Privacy, Security & Your Data", href: "/docs/privacy-security-your-data" },
      { title: "Glossary", href: "/docs/glossary" },
    ],
  },
  {
    title: "Get Help",
    href: "/docs/help",
    isSection: true,
    items: [
      { title: "Support", href: "/docs/support" },
    ],
  },
];

function DocsSidebar({ className }: { className?: string }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([
    "Meet Pieces", 
    "Quick Guides", 
    "Desktop App", 
    "Core Dependencies", 
    "Model Context Protocol (MCP)", 
    "Extensions & Plugins", 
    "Productivity Tools", 
    "Large Language Models", 
    "More", 
    "Get Help"
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isSectionOpen = (sectionTitle: string) => openSections.includes(sectionTitle);

  const filterItems = (items: any[], searchTerm: string): any[] => {
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

  const renderNavItem = (item: any, depth = 0) => {
    const hasSubItems = item.items && item.items.length > 0;
    const paddingClass = depth === 0 ? "px-3" : depth === 1 ? "px-6" : depth === 2 ? "px-9" : "px-12";

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
                  className={cn(
                    "flex-1 flex items-center py-2 text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
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
                <Button variant="ghost" size="sm" className="h-auto p-1 flex-shrink-0 mr-2">
                  {isSectionOpen(item.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1">
              {item.items.map((subItem: any) => renderNavItem(subItem, depth + 1))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "block py-2 text-sm rounded-lg transition-colors break-words whitespace-normal leading-tight text-left",
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
    <ScrollArea className={cn("h-full w-64", className)}>
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
                  renderNavItem(section)
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
        <SheetContent side="left" className="p-0 w-64">
          <ScrollArea className="h-full">
            <DocsSidebar />
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
            <div className="py-8">
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

