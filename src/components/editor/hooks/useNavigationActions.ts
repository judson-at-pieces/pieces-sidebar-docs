
import { useState } from "react";
import { NavigationSection, NavigationItem, navigationService } from "@/services/navigationService";
import { FileNode } from "@/utils/fileSystem";
import { toast } from "sonner";

interface PendingChange {
  type: 'folder' | 'file';
  sectionId: string;
  folderNode?: FileNode;
  fileNode?: FileNode;
  previewItems: NavigationItem[];
}

export function useNavigationActions(
  sections: NavigationSection[],
  setSections: (sections: NavigationSection[]) => void,
  refetch: () => Promise<any>,
  onNavigationChange: () => void
) {
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Add a single navigation item to the database
  const addNavigationItemToDb = async (item: Omit<NavigationItem, 'id'>, sectionId: string): Promise<NavigationItem> => {
    const dbItem = await navigationService.addNavigationItem({
      section_id: sectionId,
      parent_id: item.parent_id,
      title: item.title,
      href: item.href,
      description: item.description,
      icon: item.icon,
      order_index: item.order_index,
      is_auto_generated: item.is_auto_generated,
      file_path: item.file_path
    });
    
    return dbItem;
  };

  // Recursively save folder structure maintaining hierarchy
  const saveFolderStructureToDb = async (folderNode: FileNode, sectionId: string, parentDbId?: string): Promise<NavigationItem[]> => {
    const addedItems: NavigationItem[] = [];
    
    // Check if this folder has an index file
    const indexFileName = `${folderNode.name}.md`;
    const indexFile = folderNode.children?.find(child => 
      child.type === 'file' && child.name === indexFileName
    );
    
    // Create the main folder item first
    const folderItemData: Omit<NavigationItem, 'id'> = {
      title: folderNode.name.replace(/-/g, ' '),
      href: indexFile ? `/${indexFile.path.replace('.md', '')}` : `/${folderNode.path}`,
      file_path: indexFile?.path || folderNode.path,
      order_index: 0,
      parent_id: parentDbId,
      is_auto_generated: true
    };

    const folderItem = await addNavigationItemToDb(folderItemData, sectionId);
    addedItems.push(folderItem);

    // Process children using the actual database ID
    if (folderNode.children) {
      let childOrder = 0;
      
      // Add files first (except index file)
      for (const child of folderNode.children) {
        if (child.type === 'file' && child.name !== indexFileName) {
          const childItemData: Omit<NavigationItem, 'id'> = {
            title: child.name.replace('.md', '').replace(/-/g, ' '),
            href: `/${child.path.replace('.md', '')}`,
            file_path: child.path,
            order_index: childOrder++,
            parent_id: folderItem.id, // Use actual DB ID
            is_auto_generated: true
          };
          
          const childItem = await addNavigationItemToDb(childItemData, sectionId);
          addedItems.push(childItem);
        }
      }
      
      // Add subfolders recursively
      for (const child of folderNode.children) {
        if (child.type === 'folder') {
          const subFolderItems = await saveFolderStructureToDb(child, sectionId, folderItem.id);
          addedItems.push(...subFolderItems);
        }
      }
    }
    
    return addedItems;
  };

  const savePendingChanges = async () => {
    if (!pendingChange) return;

    try {
      if (pendingChange.type === 'folder' && pendingChange.folderNode) {
        const addedItems = await saveFolderStructureToDb(pendingChange.folderNode, pendingChange.sectionId);
        toast.success(`Added ${pendingChange.folderNode.name} folder with ${addedItems.length} items to navigation`);
      } else if (pendingChange.type === 'file' && pendingChange.fileNode) {
        const newItemData: Omit<NavigationItem, 'id'> = {
          title: pendingChange.fileNode.name.replace('.md', '').replace(/-/g, ' '),
          href: `/${pendingChange.fileNode.path.replace('.md', '')}`,
          file_path: pendingChange.fileNode.path,
          order_index: 0,
          parent_id: undefined,
          is_auto_generated: true
        };
        
        await addNavigationItemToDb(newItemData, pendingChange.sectionId);
        toast.success(`Added ${pendingChange.fileNode.name.replace('.md', '')} to navigation`);
      }
      
      // Refresh navigation data
      const refreshedNavigation = await refetch();
      if (refreshedNavigation.data?.sections) {
        setSections(refreshedNavigation.data.sections);
      }
      
      onNavigationChange();
      setPendingChange(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error("Failed to save changes to navigation");
    }
  };

  return {
    pendingChange,
    showConfirmDialog,
    setPendingChange,
    setShowConfirmDialog,
    savePendingChanges
  };
}
