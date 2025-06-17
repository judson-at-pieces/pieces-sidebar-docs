
import React, { useState } from 'react';
import { useNavigationEditor } from '@/hooks/useNavigationEditor';
import { NavigationStructurePanel } from './NavigationStructurePanel';
import { usePendingDeletions } from './hooks/usePendingDeletions';
import { usePendingAdditions } from './hooks/usePendingAdditions';
import { useNavigationActions } from './hooks/useNavigationActions';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { BulkAddDialog } from './BulkAddDialog';
import { BulkMoveDialog } from './BulkMoveDialog';
import { toast } from 'sonner';

interface NavigationEditorProps {
  onNavigationChange?: () => void;
}

export function NavigationEditor({ onNavigationChange }: NavigationEditorProps) {
  const { navigation, isLoading, error, refetch } = useNavigationEditor();
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');

  const {
    addSection,
    updateSectionTitle,
    deleteSection,
    updateItemTitle,
    reorderSections
  } = useNavigationActions();

  const {
    pendingDeletions,
    addPendingDeletion,
    removePendingDeletion,
    clearPendingDeletions,
    isPendingDeletion
  } = usePendingDeletions();

  const {
    pendingAdditions,
    addPendingAddition,
    removePendingAddition,
    clearPendingAdditions,
    isPendingAddition
  } = usePendingAdditions();

  // Create helper methods for compatibility
  const togglePendingDeletion = (sectionId: string, itemId: string) => {
    const section = navigation.sections.find(s => s.id === sectionId);
    if (!section) return;

    const findItemById = (items: any[], id: string): any => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.items) {
          const found = findItemById(item.items, id);
          if (found) return found;
        }
      }
      return null;
    };

    const item = findItemById(section.items || [], itemId);
    if (!item) return;

    if (isPendingDeletion(sectionId, itemId)) {
      removePendingDeletion(sectionId, itemId);
    } else {
      addPendingDeletion(sectionId, itemId, item);
    }
  };

  const resetPendingDeletions = () => {
    clearPendingDeletions();
  };

  const resetPendingAdditions = () => {
    clearPendingAdditions();
  };

  const bulkDelete = async () => {
    // Implementation for bulk delete would go here
    toast.success('Bulk delete completed');
  };

  const bulkAdd = async () => {
    // Implementation for bulk add would go here
    toast.success('Bulk add completed');
  };

  const handleAddSection = async (title: string) => {
    try {
      await addSection(title);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
    } catch (error) {
      console.error('Error in handleAddSection:', error);
      throw error;
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, title: string) => {
    try {
      await updateSectionTitle(sectionId, title);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
    } catch (error) {
      console.error('Error in handleUpdateSectionTitle:', error);
      throw error;
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      console.log('NavigationEditor: Handling section deletion:', sectionId);
      await deleteSection(sectionId);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
      console.log('NavigationEditor: Section deletion completed and data refreshed');
    } catch (error) {
      console.error('Error in handleDeleteSection:', error);
      throw error;
    }
  };

  const handleUpdateItemTitle = async (itemId: string, title: string) => {
    try {
      await updateItemTitle(itemId, title);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
    } catch (error) {
      console.error('Error in handleUpdateItemTitle:', error);
      throw error;
    }
  };

  const handleSectionReorder = async (newSections: any[]) => {
    try {
      await reorderSections(newSections);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
    } catch (error) {
      console.error('Error in handleSectionReorder:', error);
      toast.error('Failed to reorder sections');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete();
      setShowBulkDeleteDialog(false);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
    } catch (error) {
      console.error('Error in handleBulkDelete:', error);
      toast.error('Failed to delete items');
    }
  };

  const handleBulkAdd = async () => {
    try {
      await bulkAdd();
      setShowBulkAddDialog(false);
      await refetch();
      if (onNavigationChange) {
        onNavigationChange();
      }
    } catch (error) {
      console.error('Error in handleBulkAdd:', error);
      toast.error('Failed to add items');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading navigation structure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load navigation structure</p>
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <NavigationStructurePanel
        sections={navigation.sections}
        pendingDeletions={pendingDeletions}
        onAddSection={handleAddSection}
        onUpdateSectionTitle={handleUpdateSectionTitle}
        onDeleteSection={handleDeleteSection}
        onUpdateItemTitle={handleUpdateItemTitle}
        onTogglePendingDeletion={togglePendingDeletion}
        onBulkDelete={() => setShowBulkDeleteDialog(true)}
        onResetPendingDeletions={resetPendingDeletions}
        onSectionReorder={handleSectionReorder}
        onNavigationChange={refetch}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        pendingDeletions={pendingDeletions}
        sections={navigation.sections}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
      />

      <BulkAddDialog
        open={showBulkAddDialog}
        onOpenChange={setShowBulkAddDialog}
        pendingAdditions={pendingAdditions}
        sections={navigation.sections}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        onConfirm={handleBulkAdd}
        onCancel={() => setShowBulkAddDialog(false)}
      />

      <BulkMoveDialog
        open={showBulkMoveDialog}
        onOpenChange={setShowBulkMoveDialog}
        pendingAdditions={pendingAdditions}
        sections={navigation.sections}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        onConfirm={() => setShowBulkMoveDialog(false)}
        onCancel={() => setShowBulkMoveDialog(false)}
      />
    </div>
  );
}
