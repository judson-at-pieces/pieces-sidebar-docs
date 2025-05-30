
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FolderOpen, Folder, Plus, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock file structure - this would come from your content management system
const mockFileStructure = [
  {
    name: "meet-pieces",
    type: "folder",
    children: [
      { name: "fundamentals.md", type: "file" },
      { name: "windows-installation-guide.md", type: "file" },
      { name: "macos-installation-guide.md", type: "file" },
      { name: "linux-installation-guide.md", type: "file" },
      {
        name: "troubleshooting",
        type: "folder",
        children: [
          { name: "cross-platform.md", type: "file" },
          { name: "macos.md", type: "file" },
          { name: "windows.md", type: "file" },
          { name: "linux.md", type: "file" },
        ],
      },
    ],
  },
  {
    name: "quick-guides",
    type: "folder",
    children: [
      { name: "overview.md", type: "file" },
      { name: "ltm-context.md", type: "file" },
      { name: "copilot-with-context.md", type: "file" },
    ],
  },
  {
    name: "desktop",
    type: "folder",
    children: [
      { name: "download.md", type: "file" },
      { name: "onboarding.md", type: "file" },
    ],
  },
];

interface FileTreeProps {
  items: any[];
  depth?: number;
  selectedFile?: string;
  onFileSelect?: (file: string) => void;
  modifiedFiles?: Set<string>;
}

function FileTree({ items, depth = 0, selectedFile, onFileSelect, modifiedFiles }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderName)
        ? prev.filter(name => name !== folderName)
        : [...prev, folderName]
    );
  };

  const paddingClass = depth === 0 ? "pl-3" : depth === 1 ? "pl-6" : "pl-9";

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.name}>
          {item.type === "folder" ? (
            <div>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-8",
                  paddingClass
                )}
                onClick={() => toggleFolder(item.name)}
              >
                {expandedFolders.includes(item.name) ? (
                  <FolderOpen className="h-4 w-4 mr-2" />
                ) : (
                  <Folder className="h-4 w-4 mr-2" />
                )}
                <span className="truncate">{item.name}</span>
              </Button>
              {expandedFolders.includes(item.name) && item.children && (
                <FileTree
                  items={item.children}
                  depth={depth + 1}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                  modifiedFiles={modifiedFiles}
                />
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left h-8",
                paddingClass,
                selectedFile === item.name && "bg-accent"
              )}
              onClick={() => onFileSelect?.(item.name)}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="truncate flex-1">{item.name}</span>
              {modifiedFiles?.has(item.name) && (
                <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

interface EditorSidebarProps {
  selectedFile?: string;
  onFileSelect: (file: string) => void;
  modifiedFiles?: Set<string>;
}

export function EditorSidebar({ selectedFile, onFileSelect, modifiedFiles }: EditorSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* New file button */}
        <Button className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New File
        </Button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree
          items={mockFileStructure}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          modifiedFiles={modifiedFiles}
        />
      </div>
    </div>
  );
}
