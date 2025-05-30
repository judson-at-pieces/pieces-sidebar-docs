
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FolderOpen, Folder, Plus, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// File structure matching public/content directory
const fileStructure = [
  {
    name: "desktop",
    type: "folder",
    children: [
      { name: "actions.md", type: "file" },
      { name: "copilot.md", type: "file" },
      { name: "configuration.md", type: "file" },
      { name: "desktop.md", type: "file" },
      { name: "download.md", type: "file" },
      {
        name: "actions",
        type: "folder",
        children: [
          { name: "keyboard-shortcuts.md", type: "file" },
        ],
      },
      {
        name: "configuration",
        type: "folder",
        children: [
          { name: "account-and-cloud.md", type: "file" },
          { name: "additional-settings.md", type: "file" },
          { name: "aesthetics-layout.md", type: "file" },
          { name: "copilot-and-machine-learning.md", type: "file" },
          { name: "mcp.md", type: "file" },
          { name: "support.md", type: "file" },
        ],
      },
      {
        name: "copilot",
        type: "folder",
        children: [
          { name: "configuration.md", type: "file" },
          { name: "integration.md", type: "file" },
          { name: "interaction.md", type: "file" },
          { name: "multiple-environments.md", type: "file" },
        ],
      },
    ],
  },
];

interface FileTreeProps {
  items: any[];
  depth?: number;
  selectedFile?: string;
  onFileSelect?: (file: string) => void;
  modifiedFiles?: Set<string>;
  parentPath?: string;
}

function FileTree({ items, depth = 0, selectedFile, onFileSelect, modifiedFiles, parentPath = "" }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['desktop']);

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
      {items.map((item) => {
        const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        
        return (
          <div key={item.name}>
            {item.type === "folder" ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-8",
                    paddingClass
                  )}
                  onClick={() => toggleFolder(currentPath)}
                >
                  {expandedFolders.includes(currentPath) ? (
                    <FolderOpen className="h-4 w-4 mr-2" />
                  ) : (
                    <Folder className="h-4 w-4 mr-2" />
                  )}
                  <span className="truncate">{item.name}</span>
                </Button>
                {expandedFolders.includes(currentPath) && item.children && (
                  <FileTree
                    items={item.children}
                    depth={depth + 1}
                    selectedFile={selectedFile}
                    onFileSelect={onFileSelect}
                    modifiedFiles={modifiedFiles}
                    parentPath={currentPath}
                  />
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-8",
                  paddingClass,
                  selectedFile === currentPath && "bg-accent"
                )}
                onClick={() => onFileSelect?.(currentPath)}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="truncate flex-1">{item.name}</span>
                {modifiedFiles?.has(currentPath) && (
                  <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
                )}
              </Button>
            )}
          </div>
        );
      })}
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
          items={fileStructure}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          modifiedFiles={modifiedFiles}
        />
      </div>
    </div>
  );
}
