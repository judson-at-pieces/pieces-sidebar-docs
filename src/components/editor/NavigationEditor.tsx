
import { useState, useEffect } from "react";
import { useNavigationEditor } from "@/hooks/useNavigationEditor";
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
  const { navigation, refetch } = useNavigationEditor();
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

  // Check if a file is already used in navigation (including private files)
  const isFileUsed = (filePath: string): boolean => {
    const cleanPath = filePath.replace(/\/([^\/]+)\/\1\//g, '/$1/').replace(/\/([^\/]+)\/\1$/, '/$1');
    
    return sections.some(section => 
      section.items?.some(item => {
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
      
      await handleNavigationRefresh();
      toast.success(`Added section: ${title}`);
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error("Failed to add section");
      await handleNavigationRefresh();
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, title: string) => {
    try {
      await navigationService.updateNavigationSection(sectionId, {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-')
      });
      
      await handleNavigationRefresh();
      toast.success("Section updated");
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error("Failed to update section");
      await handleNavigationRefresh();
    }
  };

  const handleUpdateItemTitle = async (itemId: string, title: string) => {
    try {
      await navigationService.updateNavigationItem(itemId, { title });
      
      await handleNavigationRefresh();
      toast.success("Navigation item title updated");
    } catch (error) {
      console.error('Error updating navigation item title:', error);
      toast.error("Failed to update navigation item title");
      await handleNavigationRefresh();
    }
  };

  const handleTogglePendingDeletion = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.items) {
      return;
    }

    const findItemById = (items: any[], targetId: string): any => {
      for (const item of items) {
        if (item.id === targetId) return item;
        if (item.items && item.items.length > 0) {
          const found = findItemById(item.items, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const item = findItemById(section.items, itemId);
    if (!item) return;
    
    if (isPendingDeletion(sectionId, itemId)) {
      removePendingDeletion(sectionId, itemId);
    } else {
      addPendingDeletion(sectionId, itemId, item);
    }
  };

  const handleBulkDelete = () => {
    if (pendingDeletions.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      console.log('Starting bulk delete for', pendingDeletions.length, 'items');
      
      for (const deletion of pendingDeletions) {
        console.log('Deleting item:', deletion.item.title, 'ID:', deletion.item.id);
        await navigationService.deleteNavigationItem(deletion.item.id);
      }
      
      clearPendingDeletions();
      setShowBulkDeleteDialog(false);
      await handleNavigationRefresh();
      
      toast.success(`Deleted ${pendingDeletions.length} item${pendingDeletions.length !== 1 ? 's' : ''} from navigation`);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error("Failed to delete items from navigation");
      await handleNavigationRefresh();
    }
  };

  const handleSectionReorder = async (newSections: typeof sections) => {
    try {
      console.log('Reordering sections with new order:', newSections.map(s => ({ id: s.id, title: s.title, order_index: s.order_index })));
      
      setSections(newSections);
      
      const updatePromises = newSections.map((section, index) => 
        navigationService.updateNavigationSection(section.id, {
          order_index: index
        })
      );
      
      await Promise.all(updatePromises);
      console.log('All section orders updated successfully');
      
      await handleNavigationRefresh();
      toast.success("Sections reordered successfully");
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast.error("Failed to reorder sections");
      await handleNavigationRefresh();
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      console.log('Deleting section:', sectionId);
      await navigationService.deleteNavigationSection(sectionId);
      
      console.log('Section deleted successfully, refreshing navigation data');
      await handleNavigationRefresh();
      
      toast.success("Section deleted successfully");
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error("Failed to delete section");
      await handleNavigationRefresh();
    }
  };

  const handleNavigationRefresh = async () => {
    console.log('Refreshing navigation data');
    try {
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        console.log('Updated sections from database:', refreshedData.data.sections);
        setSections(refreshedData.data.sections);
      }
      onNavigationChange();
    } catch (error) {
      console.error('Error refreshing navigation:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Add files or folders to organize your documentation. Drag sections to reorder them. Click on titles to edit them. Items with a lock icon are private.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-4 h-full p-4">
          <div className="h-full overflow-auto">
            <AvailableFilesPanel 
              fileStructure={fileStructure}
              isFileUsed={isFileUsed}
              sections={sections}
              onAddToSection={setPendingChange}
              onShowPreview={setShowConfirmDialog}
            />
          </div>
          <div className="h-full overflow-auto">
            <NavigationStructurePanel
              sections={sections}
              pendingDeletions={pendingDeletions}
              onAddSection={handleAddSection}
              onUpdateSectionTitle={handleUpdateSectionTitle}
              onDeleteSection={handleDeleteSection}
              onUpdateItemTitle={handleUpdateItemTitle}
              onTogglePendingDeletion={handleTogglePendingDeletion}
              onBulkDelete={handleBulkDelete}
              onResetPendingDeletions={clearPendingDeletions}
              onSectionReorder={handleSectionReorder}
              onNavigationChange={handleNavigationRefresh}
            />
          </div>
        </div>
      </div>

      <FolderPreviewDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        pendingChange={pendingChange}
        onConfirm={async () => {
          await savePendingChanges();
          await handleNavigationRefresh();
        }}
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
