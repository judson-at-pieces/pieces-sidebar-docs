
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
    
    Object.keys(contentIndex).forEach(path => {
      // Remove leading /docs/ if present
      const cleanPath = path.replace(/^\/docs\//, '');
      const parts = cleanPath.split('/');
      
      // Build the tree structure
      let currentLevel = fileStructure;
      let currentPath = '';
      
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;
        const fullPath = isFile ? `${currentPath}.md` : currentPath;
        
        // Check if this node already exists at this level
        let existingNode = currentLevel.find(node => node.name === (isFile ? `${part}.md` : part));
        
        if (!existingNode) {
          const newNode: FileNode = {
            name: isFile ? `${part}.md` : part,
            type: isFile ? 'file' : 'folder',
            path: fullPath,
            children: isFile ? undefined : []
          };
          
          currentLevel.push(newNode);
          pathMap.set(fullPath, newNode);
          existingNode = newNode;
        }
        
        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children;
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
