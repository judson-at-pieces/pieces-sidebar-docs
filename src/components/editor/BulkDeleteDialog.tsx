
import { AlertTriangle, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PendingDeletion } from "./hooks/usePendingDeletions";
import { NavigationSection } from "@/services/navigationService";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingDeletions: PendingDeletion[];
  sections: NavigationSection[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkDeleteDialog({ 
  open, 
  onOpenChange, 
  pendingDeletions, 
  sections, 
  onConfirm, 
  onCancel 
}: BulkDeleteDialogProps) {
  const getSectionTitle = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.title || 'Unknown Section';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Bulk Deletion
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            You are about to delete {pendingDeletions.length} item{pendingDeletions.length !== 1 ? 's' : ''} from the navigation. This action cannot be undone.
          </p>
          
          <ScrollArea className="max-h-64 border rounded-md p-2">
            <div className="space-y-2">
              {pendingDeletions.map((deletion, index) => {
                const hasChildren = deletion.item.items && deletion.item.items.length > 0;
                return (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    {hasChildren ? (
                      <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{deletion.item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        from {getSectionTitle(deletion.sectionId)}
                        {hasChildren && ` (includes ${deletion.item.items!.length} sub-items)`}
                      </div>
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
          <Button variant="destructive" onClick={onConfirm}>
            Delete {pendingDeletions.length} Item{pendingDeletions.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
