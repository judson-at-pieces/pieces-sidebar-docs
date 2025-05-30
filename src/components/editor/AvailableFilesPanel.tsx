
import { useState } from "react";
import { FileText, Folder, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileNode } from "@/utils/fileSystem";
import { NavigationSection } from "@/services/navigationService";

interface AvailableFilesPanelProps {
  fileStructure: FileNode[];
  isFileUsed: (path: string) => boolean;
  onAddFile: (file: FileNode, sectionId: string) => void;
  onAddFolder: (folder: FileNode, sectionId: string) => void;
  sections: NavigationSection[];
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  isUsed: (path: string) => boolean;
  onAddFile: (file: FileNode, sectionId: string) => void;
  onAddFolder: (folder: FileNode, sectionId: string) => void;
  sections: NavigationSection[];
}

function FileTreeItem({ node, depth, isUsed, onAddFile, onAddFolder, sections }: FileTreeItemProps) {
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  const paddingLeft = depth * 16;
  const usedByFile = node.type === 'file' && isUsed(node.path);
  
  const handleAdd = () => {
    if (!selectedSection) return;
    
    if (node.type === 'file') {
      onAddFile(node, selectedSection);
    } else {
      onAddFolder(node, selectedSection);
    }
    setSelectedSection("");
  };

  return (
    <div>
      <div 
        className={`flex items-center gap-2 p-2 rounded hover:bg-accent/50 ${usedByFile ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {node.type === 'folder' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '-' : '+'}
            </Button>
          )}
          {node.type === 'folder' ? (
            <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
          ) : (
            <FileText className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {!usedByFile && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="h-6 w-20 text-xs">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id} className="text-xs">
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleAdd}
              disabled={!selectedSection}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              isUsed={isUsed}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              sections={sections}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AvailableFilesPanel({ 
  fileStructure, 
  isFileUsed, 
  onAddFile, 
  onAddFolder, 
  sections 
}: AvailableFilesPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Available Files
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Select a section and click + to add files or folders
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {fileStructure.map((node, index) => (
              <FileTreeItem 
                key={node.path} 
                node={node} 
                depth={0} 
                isUsed={isFileUsed}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                sections={sections}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
