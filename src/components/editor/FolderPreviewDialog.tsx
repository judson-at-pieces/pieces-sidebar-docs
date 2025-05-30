
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NavigationItem } from "@/services/navigationService";
import { FileNode } from "@/utils/fileSystem";

interface PendingChange {
  type: 'folder' | 'file';
  sectionId: string;
  folderNode?: FileNode;
  fileNode?: FileNode;
  previewItems: NavigationItem[];
}

interface FolderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingChange: PendingChange | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FolderPreviewDialog({ 
  open, 
  onOpenChange, 
  pendingChange, 
  onConfirm, 
  onCancel 
}: FolderPreviewDialogProps) {
  const renderPreviewItems = (items: NavigationItem[], depth = 0): React.ReactNode => {
    return items.map((item, index) => (
      <div key={item.id} className={`py-1 ${depth > 0 ? 'ml-4 border-l pl-2' : ''}`}>
        <div className="text-sm font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.href}</div>
        {item.items && item.items.length > 0 && (
          <div className="mt-1">
            {renderPreviewItems(item.items, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Confirm Navigation Changes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're about to add the following items to the navigation:
          </p>
          
          <div className="border rounded-lg p-4 bg-muted/50 max-h-60 overflow-y-auto">
            {pendingChange && renderPreviewItems(pendingChange.previewItems)}
          </div>
          
          <p className="text-xs text-muted-foreground">
            This will {pendingChange?.type === 'folder' ? 'preserve the folder structure' : 'add the file'} to your navigation.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
