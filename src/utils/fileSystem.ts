
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

export async function loadContentStructure(): Promise<FileNode[]> {
  try {
    // Since we can't directly access the file system in the browser,
    // we'll fetch the content-index.json to get the structure
    const response = await fetch('/content-index.json');
    if (!response.ok) {
      throw new Error('Failed to load content index');
    }
    
    const contentIndex = await response.json();
    
    // Convert the flat index into a tree structure
    const fileStructure: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();
    
    // Group paths by their folder structure
    const pathsByFolder = new Map<string, string[]>();
    
    Object.keys(contentIndex).forEach(path => {
      // Remove leading /docs/ if present
      const cleanPath = path.replace(/^\/docs\//, '');
      const parts = cleanPath.split('/');
      
      if (parts.length === 1) {
        // Root level file
        pathsByFolder.set('', [...(pathsByFolder.get('') || []), cleanPath]);
      } else {
        // Nested file - group by parent folder
        const folderPath = parts.slice(0, -1).join('/');
        pathsByFolder.set(folderPath, [...(pathsByFolder.get(folderPath) || []), cleanPath]);
      }
    });
    
    // Build the tree structure
    const processedFolders = new Set<string>();
    
    Object.keys(contentIndex).forEach(path => {
      const cleanPath = path.replace(/^\/docs\//, '');
      const parts = cleanPath.split('/');
      
      // Build the tree structure
      let currentLevel = fileStructure;
      let currentPath = '';
      
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;
        
        if (!isFile) {
          // This is a folder
          let existingFolder = currentLevel.find(node => node.name === part && node.type === 'folder');
          
          if (!existingFolder) {
            // Check if there's an index file for this folder (e.g., cli.md for cli folder)
            const indexFilePath = `${currentPath}.md`;
            const hasIndexFile = Object.keys(contentIndex).some(p => 
              p.replace(/^\/docs\//, '') === indexFilePath
            );
            
            // Only create folder if it doesn't have an index file, or if it has children beyond the index
            const folderChildren = Object.keys(contentIndex).filter(p => {
              const cleanP = p.replace(/^\/docs\//, '');
              return cleanP.startsWith(currentPath + '/') && cleanP !== indexFilePath;
            });
            
            if (!hasIndexFile || folderChildren.length > 0) {
              const newFolder: FileNode = {
                name: part,
                type: 'folder',
                path: currentPath,
                children: []
              };
              
              currentLevel.push(newFolder);
              pathMap.set(currentPath, newFolder);
              existingFolder = newFolder;
            }
          }
          
          if (existingFolder && existingFolder.children) {
            currentLevel = existingFolder.children;
          }
        } else {
          // This is a file
          // Check if this file is an index file for a folder
          const fileWithoutExt = currentPath.replace('.md', '');
          const isIndexFile = parts.length > 1 && parts[parts.length - 1].replace('.md', '') === parts[parts.length - 2];
          
          // Don't add index files as separate files if they represent folder content
          if (!isIndexFile) {
            const newFile: FileNode = {
              name: part,
              type: 'file',
              path: currentPath
            };
            
            currentLevel.push(newFile);
            pathMap.set(currentPath, newFile);
          }
        }
      });
    });
    
    return fileStructure;
  } catch (error) {
    console.error('Error loading content structure:', error);
    // Fallback to basic structure if content-index.json fails
    return [
      {
        name: 'meet-pieces',
        type: 'folder',
        path: 'meet-pieces',
        children: [
          { name: 'fundamentals.md', type: 'file', path: 'meet-pieces/fundamentals.md' },
        ]
      }
    ];
  }
}
