
import { useState, useEffect } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";
import { AvailableFilesPanel } from "./AvailableFilesPanel";
import { NavigationStructurePanel } from "./NavigationStructurePanel";
import { FolderPreviewDialog } from "./FolderPreviewDialog";
import { useNavigationActions } from "./hooks/useNavigationActions";

interface NavigationEditorProps {
  fileStructure: FileNode[];
  onNavigationChange: () => void;
}

export function NavigationEditor({ fileStructure, onNavigationChange }: NavigationEditorProps) {
  const { navigation, refetch } = useNavigation();
  const [sections, setSections] = useState(navigation?.sections || []);

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
    return sections.some(section => 
      section.items?.some(item => {
        // Check if file is used at root level or nested
        const checkNested = (navItem: any): boolean => {
          if (navItem.file_path === filePath) return true;
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
      const { addNavigationSection } = await import('@/services/navigationService');
      await addNavigationSection({
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
      const { navigationService } = await import('@/services/navigationService');
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

  const handleRemoveItem = (sectionId: string, itemIndex: number) => {
    const updatedSections = sections.map(s => {
      if (s.id === sectionId && s.items) {
        const newItems = [...s.items];
        newItems.splice(itemIndex, 1);
        return { 
          ...s, 
          items: newItems.map((item, index) => ({ ...item, order_index: index }))
        };
      }
      return s;
    });
    
    setSections(updatedSections);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Add files or folders to organize your documentation. Folder structure will be preserved.
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
            onAddSection={handleAddSection}
            onUpdateSectionTitle={handleUpdateSectionTitle}
            onRemoveItem={handleRemoveItem}
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
    </div>
  );
}
