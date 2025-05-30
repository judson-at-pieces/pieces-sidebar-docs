
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
      section.items?.some(item => item.file_path === filePath)
    );
  };

  const handleAddSection = async (title: string) => {
    try {
      const { navigationService } = await import('@/services/navigationService');
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

  const handleAddFileToSection = (file: FileNode, sectionId: string) => {
    const previewItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      title: file.name.replace('.md', '').replace(/-/g, ' '),
      href: `/${file.path.replace('.md', '')}`,
      file_path: file.path,
      order_index: 0,
      parent_id: undefined,
      is_auto_generated: true
    };
    
    setPendingChange({
      type: 'file',
      sectionId,
      fileNode: file,
      previewItems: [previewItem]
    });
    setShowConfirmDialog(true);
  };

  const handleAddFolderToSection = (folder: FileNode, sectionId: string) => {
    const createNavigationItemsFromFolder = (folderNode: FileNode, parentId?: string) => {
      const indexFileName = `${folderNode.name}.md`;
      const indexFile = folderNode.children?.find(child => 
        child.type === 'file' && child.name === indexFileName
      );
      
      const folderId = `temp-${Date.now()}-${Math.random()}`;
      const folderItem = {
        id: folderId,
        title: folderNode.name.replace(/-/g, ' '),
        href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
        file_path: indexFile?.path || folderNode.path,
        order_index: 0,
        parent_id: parentId,
        is_auto_generated: true,
        items: [] as any[]
      };

      if (folderNode.children) {
        let childOrder = 0;
        
        // Add files first (except index file)
        for (const child of folderNode.children) {
          if (child.type === 'file' && child.name !== indexFileName) {
            const childItem = {
              id: `temp-${Date.now()}-${Math.random()}`,
              title: child.name.replace('.md', '').replace(/-/g, ' '),
              href: `/${child.path.replace('.md', '')}`,
              file_path: child.path,
              order_index: childOrder++,
              parent_id: folderId,
              is_auto_generated: true
            };
            
            folderItem.items.push(childItem);
          }
        }
        
        // Add subfolders
        for (const child of folderNode.children) {
          if (child.type === 'folder') {
            const subFolderItems = createNavigationItemsFromFolder(child, folderId);
            if (subFolderItems.length > 0) {
              const subFolder = subFolderItems[0];
              subFolder.order_index = childOrder++;
              subFolder.parent_id = folderId;
              folderItem.items.push(subFolder);
            }
          }
        }
      }
      
      return [folderItem];
    };

    const previewItems = createNavigationItemsFromFolder(folder);
    
    if (previewItems.length === 0) {
      toast.info("No available files in this folder");
      return;
    }

    setPendingChange({
      type: 'folder',
      sectionId,
      folderNode: folder,
      previewItems
    });
    setShowConfirmDialog(true);
  };

  const handleRemoveItem = async (sectionId: string, itemId: string) => {
    try {
      const { navigationService } = await import('@/services/navigationService');
      
      // Delete from database if it's not a temporary item
      if (!itemId.startsWith('temp-')) {
        await navigationService.deleteNavigationItem(itemId);
      }
      
      // Update local state
      const updatedSections = sections.map(s => {
        if (s.id === sectionId && s.items) {
          const newItems = s.items.filter(item => item.id !== itemId);
          return { 
            ...s, 
            items: newItems.map((item, index) => ({ ...item, order_index: index }))
          };
        }
        return s;
      });
      
      setSections(updatedSections);
      await refetch();
      onNavigationChange();
      toast.success("Item removed from navigation");
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Failed to remove item from navigation");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Navigation Editor</h2>
        <p className="text-sm text-muted-foreground">
          Use the + buttons to add files or folders to your navigation sections.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-4 h-full p-4">
          <AvailableFilesPanel 
            fileStructure={fileStructure}
            isFileUsed={isFileUsed}
            onAddFile={handleAddFileToSection}
            onAddFolder={handleAddFolderToSection}
            sections={sections}
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
