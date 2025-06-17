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
      
      console.log('Section added, refreshing navigation data');
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        setSections(refreshedData.data.sections);
      }
      onNavigationChange();
      toast.success(`Added section: ${title}`);
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error("Failed to add section");
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, title: string) => {
    try {
      await navigationService.updateNavigationSection(sectionId, {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-')
      });
      
      console.log('Section updated, refreshing navigation data');
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        setSections(refreshedData.data.sections);
      }
      onNavigationChange();
      toast.success("Section updated");
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error("Failed to update section");
    }
  };

  const handleUpdateItemTitle = async (itemId: string, title: string) => {
    try {
      await navigationService.updateNavigationItem(itemId, { title });
      
      console.log('Navigation item title updated, refreshing navigation data');
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        setSections(refreshedData.data.sections);
      }
      onNavigationChange();
      toast.success("Navigation item title updated");
    } catch (error) {
      console.error('Error updating navigation item title:', error);
      toast.error("Failed to update navigation item title");
    }
  };

  const handlePrivacyChange = async (itemId: string, privacy: 'PUBLIC' | 'PRIVATE') => {
    try {
      await navigationService.updateNavigationItem(itemId, { privacy });
      
      console.log('Navigation item privacy updated, refreshing navigation data');
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        setSections(refreshedData.data.sections);
      }
      onNavigationChange();
      toast.success(`Item privacy updated to ${privacy.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating navigation item privacy:', error);
      toast.error("Failed to update item privacy");
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
      console.log('Starting bulk delete for', pendingDeletions.length, 'items');
      
      // Sort deletions by index in descending order to delete from end to beginning
      const sortedDeletions = [...pendingDeletions].sort((a, b) => b.itemIndex - a.itemIndex);
      
      for (const deletion of sortedDeletions) {
        console.log('Deleting item:', deletion.item.title, 'ID:', deletion.item.id);
        await navigationService.deleteNavigationItem(deletion.item.id);
      }
      
      console.log('All items deleted, refreshing navigation data');
      
      // Force refresh from the database
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        console.log('Setting new sections data:', refreshedData.data.sections);
        setSections(refreshedData.data.sections);
      }
      
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
      console.log('Reordering sections with new order:', newSections.map(s => ({ id: s.id, title: s.title, order_index: s.order_index })));
      
      // Optimistically update local state first
      setSections(newSections);
      
      // Update each section's order_index in the database
      const updatePromises = newSections.map((section, index) => 
        navigationService.updateNavigationSection(section.id, {
          order_index: index
        })
      );
      
      await Promise.all(updatePromises);
      console.log('All section orders updated successfully');
      
      // Refresh data from database to ensure consistency
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        setSections(refreshedData.data.sections);
      }
      onNavigationChange();
      toast.success("Sections reordered successfully");
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast.error("Failed to reorder sections");
      
      // Revert to original state on error
      const refreshedData = await refetch();
      if (refreshedData.data?.sections) {
        setSections(refreshedData.data.sections);
      }
    }
  };

  // Enhanced navigation refresh handler
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
          Add files or folders to organize your documentation. Drag sections to reorder them. Click on titles to edit them. Use the three-dot menu to access privacy settings.
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
              onUpdateItemTitle={handleUpdateItemTitle}
              onTogglePendingDeletion={handleTogglePendingDeletion}
              onBulkDelete={handleBulkDelete}
              onResetPendingDeletions={clearPendingDeletions}
              onSectionReorder={handleSectionReorder}
              onNavigationChange={handleNavigationRefresh}
              onPrivacyChange={handlePrivacyChange}
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
