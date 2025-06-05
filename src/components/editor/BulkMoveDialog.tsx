
import { FileText, Folder, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PendingAddition } from "./hooks/usePendingAdditions";
import { NavigationSection } from "@/services/navigationService";

interface BulkMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAdditions: PendingAddition[];
  sections: NavigationSection[];
  selectedSection: string;
  onSectionChange: (sectionId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkMoveDialog({ 
  open, 
  onOpenChange, 
  pendingAdditions, 
  sections,
  selectedSection,
  onSectionChange,
  onConfirm, 
  onCancel 
}: BulkMoveDialogProps) {
  const selectedSectionName = sections.find(s => s.id === selectedSection)?.title || "Selected Section";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Move Items to Navigation Section
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            You are about to move {pendingAdditions.length} item{pendingAdditions.length !== 1 ? 's' : ''} to a navigation section.
          </p>
          
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Select Target Section:</label>
            <Select value={selectedSection} onValueChange={onSectionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="max-h-64 border rounded-md p-2">
            <div className="space-y-2">
              {pendingAdditions.map((addition, index) => {
                const hasChildren = addition.node.children && addition.node.children.length > 0;
                return (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    {addition.type === 'folder' ? (
                      <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {addition.node.name.replace('.md', '')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {addition.type === 'folder' && hasChildren && 
                          `includes ${addition.node.children!.length} sub-items`
                        }
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="text-xs text-primary font-medium truncate max-w-20">
                      {selectedSection ? selectedSectionName : "..."}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={!selectedSection}
          >
            Move {pendingAdditions.length} Item{pendingAdditions.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
