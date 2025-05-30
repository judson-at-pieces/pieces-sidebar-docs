
import { Droppable } from "@hello-pangea/dnd";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileNode } from "@/utils/fileSystem";
import { FileTreeItem } from "./FileTreeItem";

interface AvailableFilesPanelProps {
  fileStructure: FileNode[];
  isFileUsed: (path: string) => boolean;
}

export function AvailableFilesPanel({ fileStructure, isFileUsed }: AvailableFilesPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Available Files
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <Droppable droppableId="available-files" isDropDisabled={true}>
          {(provided) => (
            <ScrollArea className="h-full">
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                {fileStructure.map((node, index) => (
                  <FileTreeItem 
                    key={node.path} 
                    node={node} 
                    depth={0} 
                    index={index}
                    isUsed={isFileUsed}
                  />
                ))}
                {provided.placeholder}
              </div>
            </ScrollArea>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}
