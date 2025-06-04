
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  title: string;
  children?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  level?: number;
  isActive?: boolean;
  onClick?: (id: string) => void;
  id?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  title, 
  children, 
  isExpanded = false, 
  onToggle,
  level = 0,
  isActive = false,
  onClick,
  id
}) => {
  const hasChildren = !!children;
  const paddingLeft = level * 16 + 16;

  const handleClick = () => {
    if (hasChildren) {
      onToggle?.();
    } else if (onClick && id) {
      onClick(id);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors",
          isActive && "bg-blue-50 text-blue-600 font-medium",
          level > 0 && "text-gray-600"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
      >
        <span className="flex items-center gap-2">
          {title}
        </span>
        {hasChildren && (
          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
};

interface DocumentationSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const DocumentationSidebar: React.FC<DocumentationSidebarProps> = ({ activeSection, setActiveSection }) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'meet-pieces': true,
    'pieces-quick-guides': true,
    'pieces-suite': true,
    'desktop-app': true,
    'pieces-mcp': false,
    'pieces-ides': false,
    'pieces-productivity': false,
    'pieces-more': false
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleItemClick = (itemKey: string) => {
    setActiveSection(itemKey);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-60px)] overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {/* Meet Pieces Section */}
          <SidebarItem
            title="Meet Pieces"
            isExpanded={expandedSections['meet-pieces']}
            onToggle={() => toggleSection('meet-pieces')}
          >
            <SidebarItem
              title="Fundamentals"
              level={1}
              isActive={activeSection === 'fundamentals'}
              onClick={handleItemClick}
              id="fundamentals"
            />
            <SidebarItem
              title="Installation Guide | Windows"
              level={1}
              isActive={activeSection === 'install-windows'}
              onClick={handleItemClick}
              id="install-windows"
            />
            <SidebarItem
              title="Installation Guide | macOS"
              level={1}
              isActive={activeSection === 'install-macos'}
              onClick={handleItemClick}
              id="install-macos"
            />
            <SidebarItem
              title="Installation Guide | Linux"
              level={1}
              isActive={activeSection === 'install-linux'}
              onClick={handleItemClick}
              id="install-linux"
            />
            <SidebarItem
              title="Troubleshooting"
              level={1}
              isActive={activeSection === 'troubleshooting'}
              onClick={handleItemClick}
              id="troubleshooting"
            />
          </SidebarItem>

          {/* Pieces | Quick Guides Section */}
          <SidebarItem
            title="Pieces | Quick Guides"
            isExpanded={expandedSections['pieces-quick-guides']}
            onToggle={() => toggleSection('pieces-quick-guides')}
          >
            <SidebarItem
              title="Overview"
              level={1}
              isActive={activeSection === 'overview'}
              onClick={handleItemClick}
              id="overview"
            />
            <SidebarItem
              title="Using Long-Term Memory Context"
              level={1}
              isActive={activeSection === 'using-ltm-context'}
              onClick={handleItemClick}
              id="using-ltm-context"
            />
            <SidebarItem
              title="Using Pieces Copilot with Context"
              level={1}
              isActive={activeSection === 'using-copilot-context'}
              onClick={handleItemClick}
              id="using-copilot-context"
            />
            <SidebarItem
              title="Long-Term Memory Prompting Guide"
              level={1}
              isActive={activeSection === 'ltm-prompting-guide'}
              onClick={handleItemClick}
              id="ltm-prompting-guide"
            />
          </SidebarItem>

          {/* Pieces | Suite Section */}
          <SidebarItem
            title="Pieces | Suite"
            isExpanded={expandedSections['pieces-suite']}
            onToggle={() => toggleSection('pieces-suite')}
          >
            <SidebarItem
              title="Desktop App"
              level={1}
              isExpanded={expandedSections['desktop-app']}
              onToggle={() => toggleSection('desktop-app')}
            >
              <SidebarItem
                title="Core Dependencies"
                level={2}
                isActive={activeSection === 'core-dependencies'}
                onClick={handleItemClick}
                id="core-dependencies"
              />
            </SidebarItem>
          </SidebarItem>

          {/* Pieces | MCP Section */}
          <SidebarItem
            title="Pieces | MCP"
            isExpanded={expandedSections['pieces-mcp']}
            onToggle={() => toggleSection('pieces-mcp')}
          >
            <SidebarItem
              title="Introducing Pieces Model Context Protocol (MCP)"
              level={1}
              isActive={activeSection === 'introducing-mcp'}
              onClick={handleItemClick}
              id="introducing-mcp"
            />
            <SidebarItem
              title="MCP Prompting"
              level={1}
              isActive={activeSection === 'mcp-prompting'}
              onClick={handleItemClick}
              id="mcp-prompting"
            />
            <SidebarItem
              title="MCP → Cursor"
              level={1}
              isActive={activeSection === 'mcp-cursor'}
              onClick={handleItemClick}
              id="mcp-cursor"
            />
            <SidebarItem
              title="MCP → GitHub Copilot"
              level={1}
              isActive={activeSection === 'mcp-github-copilot'}
              onClick={handleItemClick}
              id="mcp-github-copilot"
            />
            <SidebarItem
              title="MCP → Goose"
              level={1}
              isActive={activeSection === 'mcp-goose'}
              onClick={handleItemClick}
              id="mcp-goose"
            />
          </SidebarItem>

          {/* Pieces | IDEs Section */}
          <SidebarItem
            title="Pieces | IDEs"
            isExpanded={expandedSections['pieces-ides']}
            onToggle={() => toggleSection('pieces-ides')}
          >
            <SidebarItem
              title="Visual Studio Code Extension"
              level={1}
              isActive={activeSection === 'vscode-extension'}
              onClick={handleItemClick}
              id="vscode-extension"
            />
            <SidebarItem
              title="JetBrains Plugin"
              level={1}
              isActive={activeSection === 'jetbrains-plugin'}
              onClick={handleItemClick}
              id="jetbrains-plugin"
            />
            <SidebarItem
              title="Visual Studio Extension"
              level={1}
              isActive={activeSection === 'visual-studio-extension'}
              onClick={handleItemClick}
              id="visual-studio-extension"
            />
            <SidebarItem
              title="Sublime Text Plugin"
              level={1}
              isActive={activeSection === 'sublime-text-plugin'}
              onClick={handleItemClick}
              id="sublime-text-plugin"
            />
            <SidebarItem
              title="JupyterLab Extension"
              level={1}
              isActive={activeSection === 'jupyterlab-extension'}
              onClick={handleItemClick}
              id="jupyterlab-extension"
            />
            <SidebarItem
              title="Neovim Plugin"
              level={1}
              isActive={activeSection === 'neovim-plugin'}
              onClick={handleItemClick}
              id="neovim-plugin"
            />
          </SidebarItem>

          {/* Pieces | Productivity Section */}
          <SidebarItem
            title="Pieces | Productivity"
            isExpanded={expandedSections['pieces-productivity']}
            onToggle={() => toggleSection('pieces-productivity')}
          >
            <SidebarItem
              title="Obsidian Plugin"
              level={1}
              isActive={activeSection === 'obsidian-plugin'}
              onClick={handleItemClick}
              id="obsidian-plugin"
            />
            <SidebarItem
              title="Web Extension"
              level={1}
              isActive={activeSection === 'web-extension'}
              onClick={handleItemClick}
              id="web-extension"
            />
            <SidebarItem
              title="Pieces CLI"
              level={1}
              isActive={activeSection === 'pieces-cli'}
              onClick={handleItemClick}
              id="pieces-cli"
            />
            <SidebarItem
              title="Raycast Plugin"
              level={1}
              isActive={activeSection === 'raycast-plugin'}
              onClick={handleItemClick}
              id="raycast-plugin"
            />
          </SidebarItem>

          {/* Pieces | More Section */}
          <SidebarItem
            title="Pieces | More"
            isExpanded={expandedSections['pieces-more']}
            onToggle={() => toggleSection('pieces-more')}
          >
            <SidebarItem
              title="Privacy, Security & Your Data"
              level={1}
              isActive={activeSection === 'privacy-security'}
              onClick={handleItemClick}
              id="privacy-security"
            />
            <SidebarItem
              title="Compatible LLMs"
              level={1}
              isActive={activeSection === 'compatible-llms'}
              onClick={handleItemClick}
              id="compatible-llms"
            />
            <SidebarItem
              title="Glossary"
              level={1}
              isActive={activeSection === 'glossary'}
              onClick={handleItemClick}
              id="glossary"
            />
          </SidebarItem>

          <div className="pt-4 border-t border-gray-200 mt-4">
            <SidebarItem
              title="Get Help"
              isActive={activeSection === 'get-help'}
              onClick={handleItemClick}
              id="get-help"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationSidebar;
