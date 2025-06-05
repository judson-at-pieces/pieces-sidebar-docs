
import { useState, useEffect } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";
import { AvailableFilesPanel } from "./AvailableFilesPanel";
import { NavigationStructurePanel } from "./NavigationStructurePanel";
import { FolderPreviewDialog } from "./FolderPreviewDialog";
import { BulkDeleteDialog } from "./BulkDeleteDialog";
import { useNavigationActions } from "./hooks/useNavigationActions";
import { usePendingDeletions } from "./hooks/usePendingDeletions";
import { navigationService } from "@/services/navigationService";

interface NavigationEditorProps {
  fileStructure: FileNode[];
  onNavigationChange: () => void;
}

export function NavigationEditor({ fileStructure, onNavigationChange }: NavigationEditorProps) {
  const { navigation, refetch } = useNavigation();
  const [sections, setSections] = useState(navigation?.sections || []);

  const {
    pendingDeletions,
    addPendingDeletion,
    removePendingDeletion,
    clearPendingDeletions,
    isPendingDeletion
  } = usePendingDeletions();

  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    if (navigation?.sections) {
      setSections(navigation.sections);
    }
  }, [navigation]);

  const {
    pendingChange,
    showConfirmDialog,
    setPendingChange,
    setShowConfirmDialog,
    savePendingChanges
  } = useNavigationActions(sections, setSections, refetch, onNavigationChange);

  // Check if a file is already used in navigation
  const isFileUsed = (filePath: string): boolean => {
    // Clean up path to prevent duplicate checking
    const cleanPath = filePath.replace(/\/([^\/]+)\/\1\//g, '/$1/').replace(/\/([^\/]+)\/\1$/, '/$1');
    
    return sections.some(section => 
      section.items?.some(item => {
        // Check if file is used at root level or nested
        const checkNested = (navItem: any): boolean => {
          if (navItem.file_path === filePath || navItem.file_path === cleanPath) return true;
          if (navItem.href === `/${filePath.replace('.md', '')}` || navItem.href === `/${cleanPath.replace('.md', '')}`) return true;
          if (navItem.items && navItem.items.length > 0) {
            return navItem.items.some((nestedItem: any) => checkNested(nestedItem));
          }
          return false;
        };
        return checkNested(item);
      })
    );
  };

  const handleAddSection = async (title: string) => {
    try {
      await navigationService.addNavigationSection({
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        order_index: sections.length
      });
      
      await refetch();
      onNavigationChange();
      toast.success(`Added section: ${title}`);
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, title: string) => {
    try {
      await navigationService.updateNavigationSection(sectionId, {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-')
      });
      
      await refetch();
      onNavigationChange();
      toast.success("Section updated");
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const handleTogglePendingDeletion = (sectionId: string, itemIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.items || !section.items[itemIndex]) {
      return;
    }

    const item = section.items[itemIndex];
    
    if (isPendingDeletion(sectionId, itemIndex)) {
      removePendingDeletion(sectionId, itemIndex);
    } else {
      addPendingDeletion(sectionId, itemIndex, item);
    }
  };

  const handleBulkDelete = () => {
    if (pendingDeletions.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      // Sort deletions by index in descending order to delete from end to beginning
      const sortedDeletions = [...pendingDeletions].sort((a, b) => b.itemIndex - a.itemIndex);
      
      for (const deletion of sortedDeletions) {
        await navigationService.deleteNavigationItem(deletion.item.id);
      }
      
      // Update local state
      const updatedSections = sections.map(section => {
        const sectionDeletions = sortedDeletions.filter(d => d.sectionId === section.id);
        if (sectionDeletions.length === 0) return section;
        
        let newItems = [...(section.items || [])];
        sectionDeletions.forEach(deletion => {
          newItems.splice(deletion.itemIndex, 1);
        });
        
        // Update order indices
        newItems = newItems.map((item, index) => ({ ...item, order_index: index }));
        
        return { ...section, items: newItems };
      });
      
      setSections(updatedSections);
      clearPendingDeletions();
      setShowBulkDeleteDialog(false);
      onNavigationChange();
      toast.success(`Deleted ${sortedDeletions.length} item${sortedDeletions.length !== 1 ? 's' : ''} from navigation`);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error("Failed to delete items from navigation");
    }
  };

  const handleSectionReorder = async (newSections: typeof sections) => {
    try {
      // Update sections with new order
      setSections(newSections);
      
      // Update order in database
      for (let i = 0; i < newSections.length; i++) {
        await navigationService.updateNavigationSection(newSections[i].id, {
          order_index: i
        });
      }
      
      await refetch();
      onNavigationChange();
      toast.success("Sections reordered");
    } catch (error) {
      toast.error("Failed to reorder sections");
      // Revert on error
      await refetch();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Add files or folders to organize your documentation. Drag sections to reorder them.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-4 h-full p-4">
          <AvailableFilesPanel 
            fileStructure={fileStructure}
            isFileUsed={isFileUsed}
            sections={sections}
            onAddToSection={setPendingChange}
            onShowPreview={setShowConfirmDialog}
          />
          <NavigationStructurePanel
            sections={sections}
            pendingDeletions={pendingDeletions}
            onAddSection={handleAddSection}
            onUpdateSectionTitle={handleUpdateSectionTitle}
            onTogglePendingDeletion={handleTogglePendingDeletion}
            onBulkDelete={handleBulkDelete}
            onResetPendingDeletions={clearPendingDeletions}
            onSectionReorder={handleSectionReorder}
            onNavigationChange={async () => {
              const refreshedNavigation = await refetch();
              if (refreshedNavigation.data?.sections) {
                setSections(refreshedNavigation.data.sections);
              }
              onNavigationChange();
            }}
          />
        </div>
      </div>

      <FolderPreviewDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        pendingChange={pendingChange}
        onConfirm={savePendingChanges}
        onCancel={() => {
          setPendingChange(null);
          setShowConfirmDialog(false);
        }}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        pendingDeletions={pendingDeletions}
        sections={sections}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
      />
    </div>
  );
}
