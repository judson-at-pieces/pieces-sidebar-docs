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
  const saveFolderStructureToDb = async (
    folderNode: FileNode, 
    sectionId: string, 
    parentDbId?: string
  ): Promise<NavigationItem[]> => {
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

  // Enhanced bulk operations that maintain hierarchy
  const processBulkItemsWithHierarchy = async (previewItems: NavigationItem[], sectionId: string): Promise<NavigationItem[]> => {
    const addedItems: NavigationItem[] = [];
    const parentMap = new Map<string, string>(); // temp ID -> real DB ID mapping
    
    console.log('Processing hierarchical bulk items:', previewItems.length, 'items');
    
    // Sort items by hierarchy - root items first, then children by depth
    const sortedItems = [...previewItems].sort((a, b) => {
      // Root items (no parent_id) come first
      if (!a.parent_id && b.parent_id) return -1;
      if (a.parent_id && !b.parent_id) return 1;
      
      // If both have parents, sort by the depth of nesting (fewer parents = higher priority)
      const aDepth = getItemDepth(a, previewItems);
      const bDepth = getItemDepth(b, previewItems);
      if (aDepth !== bDepth) return aDepth - bDepth;
      
      return a.order_index - b.order_index;
    });
    
    for (const item of sortedItems) {
      console.log('Processing hierarchical item:', item.title, 'parent_id:', item.parent_id);
      
      // Map parent_id if it's a temp ID to the real DB ID
      let realParentId = item.parent_id;
      if (item.parent_id && parentMap.has(item.parent_id)) {
        realParentId = parentMap.get(item.parent_id);
        console.log('Mapped parent ID from', item.parent_id, 'to', realParentId);
      }
      
      const itemData: Omit<NavigationItem, 'id'> = {
        title: item.title,
        href: item.href,
        description: item.description,
        icon: item.icon,
        order_index: item.order_index,
        parent_id: realParentId,
        is_auto_generated: item.is_auto_generated,
        file_path: item.file_path
      };
      
      const savedItem = await addNavigationItemToDb(itemData, sectionId);
      addedItems.push(savedItem);
      
      // Store mapping for children to reference
      if (item.id) {
        parentMap.set(item.id, savedItem.id);
        console.log('Stored parent mapping:', item.id, '->', savedItem.id);
      }
    }
    
    return addedItems;
  };

  // Helper function to calculate item depth for proper sorting
  const getItemDepth = (item: NavigationItem, allItems: NavigationItem[]): number => {
    if (!item.parent_id) return 0;
    
    const parent = allItems.find(i => i.id === item.parent_id);
    if (!parent) return 1;
    
    return 1 + getItemDepth(parent, allItems);
  };

  // Process bulk operations that contain multiple items
  const processBulkItems = async (previewItems: NavigationItem[], sectionId: string): Promise<NavigationItem[]> => {
    const addedItems: NavigationItem[] = [];
    const parentMap = new Map<string, string>(); // temp ID -> real DB ID mapping
    
    console.log('Processing bulk items:', previewItems.length, 'items');
    
    // Sort items by hierarchy - root items first, then children
    const sortedItems = [...previewItems].sort((a, b) => {
      // Root items (no parent_id) come first
      if (!a.parent_id && b.parent_id) return -1;
      if (a.parent_id && !b.parent_id) return 1;
      return a.order_index - b.order_index;
    });
    
    for (const item of sortedItems) {
      console.log('Processing item:', item.title, 'parent_id:', item.parent_id);
      
      // Map parent_id if it's a temp ID to the real DB ID
      let realParentId = item.parent_id;
      if (item.parent_id && parentMap.has(item.parent_id)) {
        realParentId = parentMap.get(item.parent_id);
        console.log('Mapped parent ID from', item.parent_id, 'to', realParentId);
      }
      
      const itemData: Omit<NavigationItem, 'id'> = {
        title: item.title,
        href: item.href,
        description: item.description,
        icon: item.icon,
        order_index: item.order_index,
        parent_id: realParentId,
        is_auto_generated: item.is_auto_generated,
        file_path: item.file_path
      };
      
      const savedItem = await addNavigationItemToDb(itemData, sectionId);
      addedItems.push(savedItem);
      
      // Store mapping for children to reference
      if (item.id) {
        parentMap.set(item.id, savedItem.id);
        console.log('Stored parent mapping:', item.id, '->', savedItem.id);
      }
    }
    
    return addedItems;
  };

  const savePendingChanges = async () => {
    if (!pendingChange) return;

    try {
      console.log('Saving pending changes:', pendingChange.type, 'with', pendingChange.previewItems.length, 'items');

      if (pendingChange.type === 'folder' && pendingChange.folderNode) {
        // Single folder operation - preserve hierarchy
        const addedItems = await saveFolderStructureToDb(pendingChange.folderNode, pendingChange.sectionId);
        toast.success(`Added ${pendingChange.folderNode.name} folder with ${addedItems.length} items to navigation`);
      } else if (pendingChange.type === 'file' && pendingChange.fileNode) {
        // Single file operation
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
      } else if (pendingChange.previewItems.length > 0) {
        // Bulk operation - check if it's hierarchical or flat based on type
        if (pendingChange.type === 'folder') {
          // Hierarchical bulk operation
          console.log('Processing hierarchical bulk operation with', pendingChange.previewItems.length, 'items');
          const addedItems = await processBulkItemsWithHierarchy(pendingChange.previewItems, pendingChange.sectionId);
          toast.success(`Added ${addedItems.length} items with preserved hierarchy to navigation`);
        } else {
          // Flat bulk operation (fallback)
          console.log('Processing flat bulk operation with', pendingChange.previewItems.length, 'items');
          const addedItems = await processBulkItems(pendingChange.previewItems, pendingChange.sectionId);
          toast.success(`Added ${addedItems.length} items to navigation`);
        }
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
